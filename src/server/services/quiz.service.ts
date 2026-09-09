import {
  getQuizzesCol,
  getQuizAttemptsCol,
  getQuestionsCol,
  getQuestionProgressCol,
  getTopicsCol,
  getCategoriesCol,
  toObjectId,
  formatDoc,
  formatDocs,
} from "@/server/db";
import { z } from "zod";
import { CreateQuizSchema, SubmitQuizAttemptSchema } from "@/lib/validation/schemas";
import { SpacedRepetitionService } from "./spaced-repetition.service";

export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;
export type SubmitQuizAttemptInput = z.infer<typeof SubmitQuizAttemptSchema>;

export class QuizService {
  /**
   * Builds and persists a customized quiz based on user filters.
   */
  static async createQuiz(userId: string, data: CreateQuizInput) {
    let questionIds: string[] = [];

    if (data.specificQuestionIds && data.specificQuestionIds.length > 0) {
      questionIds = data.specificQuestionIds;
    } else if (data.dueForReviewOnly) {
      const dueQuestions = await SpacedRepetitionService.getQuestionsDueToday(userId, data.questionCount);
      questionIds = dueQuestions.map((q) => q.id || "").filter(Boolean);
    } else {
      const filter: any = { userId, isArchived: false };

      if (data.topicId) filter.topicId = data.topicId;
      if (data.difficulty) filter.difficulty = data.difficulty;
      if (data.tagId) filter.tagIds = data.tagId;
      if (data.onlyFavorites) filter.isFavorite = true;

      // If onlyIncorrect, join with questionProgress
      if (data.onlyIncorrect) {
        const progressCol = await getQuestionProgressCol();
        const incorrectProgress = await progressCol
          .find({ userId, incorrectCount: { $gt: 0 } })
          .project({ questionId: 1 })
          .toArray();
        const ids = incorrectProgress.map((p) => p.questionId);
        filter._id = { $in: ids.map(toObjectId) };
      }

      const questionsCol = await getQuestionsCol();
      const availableQuestions = await questionsCol
        .find(filter)
        .project({ _id: 1 })
        .limit(300)
        .toArray();

      let ids = availableQuestions.map((q) => q._id.toString());
      if (data.shuffleQuestions) {
        ids = ids.sort(() => Math.random() - 0.5);
      }

      questionIds = ids.slice(0, data.questionCount);
    }

    if (questionIds.length === 0) {
      throw new Error("No questions match the selected criteria.");
    }

    const quizzesCol = await getQuizzesCol();
    const now = new Date();
    const doc: any = {
      userId,
      title: data.title,
      description: data.description || null,
      mode: data.mode,
      timeLimitMinutes: data.timeLimitMinutes || null,
      shuffleQuestions: data.shuffleQuestions,
      shuffleOptions: data.shuffleOptions,
      showExplanations: data.showExplanations,
      questionIds,
      totalQuestions: questionIds.length,
      createdAt: now,
      updatedAt: now,
    };

    const res = await quizzesCol.insertOne(doc);
    return formatDoc({ ...doc, _id: res.insertedId });
  }

  /**
   * Retrieves a quiz with its questions and options.
   */
  static async getQuiz(userId: string, quizId: string) {
    const quizzesCol = await getQuizzesCol();
    const quiz = await quizzesCol.findOne({ _id: toObjectId(quizId), userId });

    if (!quiz) throw new Error("Quiz not found or unauthorized");

    const questionsCol = await getQuestionsCol();
    const topicsCol = await getTopicsCol();
    const categoriesCol = await getCategoriesCol();

    const qObjectIds = quiz.questionIds.map(toObjectId);
    const questions = await questionsCol.find({ _id: { $in: qObjectIds }, userId }).toArray();

    // Attach topics & categories
    const topicIds = questions.map((q) => q.topicId).filter((id): id is string => Boolean(id)).map(toObjectId);
    const categoryIds = questions.map((q) => q.categoryId).filter((id): id is string => Boolean(id)).map(toObjectId);

    const [topics, categories] = await Promise.all([
      topicsCol.find({ _id: { $in: topicIds } }).toArray(),
      categoriesCol.find({ _id: { $in: categoryIds } }).toArray(),
    ]);

    const topicMap = new Map(topics.map((t) => [t._id?.toString(), t]));
    const catMap = new Map(categories.map((c) => [c._id?.toString(), c]));

    const populatedQuestions = questions.map((q) => ({
      ...q,
      id: q._id.toString(),
      topic: q.topicId ? formatDoc(topicMap.get(q.topicId) || null) : null,
      category: q.categoryId ? formatDoc(catMap.get(q.categoryId) || null) : null,
    }));

    // Sort questions in quiz questionIds order
    const orderedQuestions = quiz.questionIds
      .map((id) => populatedQuestions.find((q) => q.id === id))
      .filter(Boolean) as typeof populatedQuestions;

    // Apply option shuffling if configured
    const processedQuestions = orderedQuestions.map((q) => {
      let opts = [...q.options];
      if (quiz.shuffleOptions) {
        opts = opts.sort(() => Math.random() - 0.5);
      }
      return {
        ...q,
        options: opts,
      };
    });

    return {
      quiz: formatDoc(quiz),
      questions: processedQuestions,
    };
  }

  /**
   * Submits a completed quiz attempt, scores it, records attempts, and updates spaced repetition schedules.
   */
  static async submitQuizAttempt(userId: string, data: SubmitQuizAttemptInput) {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const questionsCol = await getQuestionsCol();

    // Validate and score each answer
    const scoredAnswers = await Promise.all(
      data.answers.map(async (ans) => {
        const question = await questionsCol.findOne(
          { _id: toObjectId(ans.questionId) },
          { projection: { options: 1 } }
        );

        let isCorrect = false;
        if (ans.selectedOptionId && question) {
          const selected = question.options.find((o) => o.id === ans.selectedOptionId);
          if (selected?.isCorrect) {
            isCorrect = true;
          }
        }

        if (!ans.selectedOptionId) {
          unansweredCount++;
        } else if (isCorrect) {
          correctCount++;
        } else {
          incorrectCount++;
        }

        // Update spaced repetition schedule
        await SpacedRepetitionService.recordQuestionAttempt(
          userId,
          ans.questionId,
          isCorrect,
          ans.timeSpentSeconds
        );

        return {
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId || null,
          isCorrect,
          timeSpentSeconds: ans.timeSpentSeconds || 0,
        };
      })
    );

    const totalQuestions = data.answers.length;
    const accuracy = totalQuestions > 0 ? parseFloat(((correctCount / totalQuestions) * 100).toFixed(2)) : 0;
    const score = correctCount;
    const now = new Date();

    const attemptsCol = await getQuizAttemptsCol();
    const doc: any = {
      userId,
      quizId: data.quizId || null,
      title: data.title,
      mode: data.mode,
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      score,
      accuracy,
      timeTakenSeconds: data.timeTakenSeconds,
      answers: scoredAnswers,
      completedAt: now,
      createdAt: now,
    };

    const res = await attemptsCol.insertOne(doc);

    // Invalidate cached analytics metrics since a new attempt was recorded
    try {
      const { AnalyticsService } = await import("./analytics.service");
      AnalyticsService.invalidateUserMetrics(userId);
    } catch {
      // Non-critical
    }

    return formatDoc({ ...doc, _id: res.insertedId });
  }

  /**
   * Gets attempts history for the user.
   */
  static async getAttempts(userId: string, limit: number = 20) {
    const attemptsCol = await getQuizAttemptsCol();
    const quizzesCol = await getQuizzesCol();

    const attempts = await attemptsCol
      .find({ userId })
      .sort({ completedAt: -1 })
      .limit(limit)
      .toArray();

    const quizIds = attempts.map((a) => a.quizId).filter((id): id is string => Boolean(id)).map(toObjectId);
    const quizzes = quizIds.length > 0 ? await quizzesCol.find({ _id: { $in: quizIds } }).toArray() : [];
    const quizMap = new Map(quizzes.map((q) => [q._id.toString(), q]));

    return attempts.map((a) => ({
      ...formatDoc(a),
      quiz: a.quizId ? formatDoc(quizMap.get(a.quizId) || null) : null,
    }));
  }

  /**
   * Gets a specific attempt result with full breakdown.
   */
  static async getAttemptById(userId: string, attemptId: string) {
    const attemptsCol = await getQuizAttemptsCol();
    const attempt = await attemptsCol.findOne({ _id: toObjectId(attemptId), userId });

    if (!attempt) throw new Error("Attempt not found");

    const quizzesCol = await getQuizzesCol();
    const questionsCol = await getQuestionsCol();
    const topicsCol = await getTopicsCol();
    const categoriesCol = await getCategoriesCol();

    let quiz = null;
    if (attempt.quizId) {
      const qDoc = await quizzesCol.findOne({ _id: toObjectId(attempt.quizId) });
      quiz = formatDoc(qDoc);
    }

    const questionIds = attempt.answers.map((a) => toObjectId(a.questionId));
    const questions = await questionsCol.find({ _id: { $in: questionIds } }).toArray();

    const topicIds = questions.map((q) => q.topicId).filter((id): id is string => Boolean(id)).map(toObjectId);
    const categoryIds = questions.map((q) => q.categoryId).filter((id): id is string => Boolean(id)).map(toObjectId);

    const [topics, categories] = await Promise.all([
      topicsCol.find({ _id: { $in: topicIds } }).toArray(),
      categoriesCol.find({ _id: { $in: categoryIds } }).toArray(),
    ]);

    const topicMap = new Map(topics.map((t) => [t._id.toString(), t]));
    const catMap = new Map(categories.map((c) => [c._id.toString(), c]));

    const detailedAnswers = attempt.answers.map((ans) => {
      const q = questions.find((item) => item._id.toString() === ans.questionId);
      const selectedOption = q?.options.find((o) => o.id === ans.selectedOptionId);
      const correctOption = q?.options.find((o) => o.isCorrect);

      const topicDoc = q?.topicId ? topicMap.get(q.topicId) : null;
      const catDoc = q?.categoryId ? catMap.get(q.categoryId) : null;

      return {
        ...ans,
        questionText: q?.questionText || "",
        explanation: q?.explanation || "",
        difficulty: q?.difficulty || "MEDIUM",
        topic: topicDoc?.name || "General",
        category: catDoc?.name || "General",
        options: q?.options || [],
        selectedOptionText: selectedOption?.optionText || "Unanswered",
        correctOptionText: correctOption?.optionText || "",
      };
    });

    return {
      attempt: { ...formatDoc(attempt), quiz },
      answers: detailedAnswers,
    };
  }
}
