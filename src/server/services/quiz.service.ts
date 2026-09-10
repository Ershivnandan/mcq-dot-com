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

      // Date range filter on questionDate
      if (data.dateFrom || data.dateTo) {
        filter.questionDate = {};
        if (data.dateFrom) {
          const fromDate = new Date(data.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          filter.questionDate.$gte = fromDate;
        }
        if (data.dateTo) {
          const toDate = new Date(data.dateTo);
          toDate.setHours(23, 59, 59, 999);
          filter.questionDate.$lte = toDate;
        }
      }

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
      let queryCursor = questionsCol.find(filter).project({ _id: 1, questionDate: 1 });
      if (data.dateFrom || data.dateTo) {
        queryCursor = queryCursor.sort({ questionDate: 1, orderIndex: 1, _id: 1 });
      }

      const availableQuestions = await queryCursor
        .limit(Math.max(data.questionCount, 2000))
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
      dateFrom: data.dateFrom || null,
      dateTo: data.dateTo || null,
      isSaved: false,
      savedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const res = await quizzesCol.insertOne(doc);
    return formatDoc({ ...doc, _id: res.insertedId });
  }

  /**
   * Counts how many questions match the given quiz filter criteria.
   */
  static async countMatchingQuestions(userId: string, criteria: Partial<CreateQuizInput>) {
    if (criteria.dueForReviewOnly) {
      const dueQuestions = await SpacedRepetitionService.getQuestionsDueToday(userId, 2000);
      return dueQuestions.length;
    }

    if (criteria.specificQuestionIds && criteria.specificQuestionIds.length > 0) {
      return criteria.specificQuestionIds.length;
    }

    const filter: any = { userId, isArchived: false };

    if (criteria.topicId && criteria.topicId !== "all") filter.topicId = criteria.topicId;
    if (criteria.difficulty) filter.difficulty = criteria.difficulty;
    if (criteria.tagId) filter.tagIds = criteria.tagId;
    if (criteria.onlyFavorites) filter.isFavorite = true;

    // Date range filter on questionDate
    if (criteria.dateFrom || criteria.dateTo) {
      filter.questionDate = {};
      if (criteria.dateFrom) {
        const fromDate = new Date(criteria.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filter.questionDate.$gte = fromDate;
      }
      if (criteria.dateTo) {
        const toDate = new Date(criteria.dateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.questionDate.$lte = toDate;
      }
    }

    // If onlyIncorrect, join with questionProgress
    if (criteria.onlyIncorrect) {
      const progressCol = await getQuestionProgressCol();
      const incorrectProgress = await progressCol
        .find({ userId, incorrectCount: { $gt: 0 } })
        .project({ questionId: 1 })
        .toArray();
      const ids = incorrectProgress.map((p) => p.questionId);
      filter._id = { $in: ids.map(toObjectId) };
    }

    const questionsCol = await getQuestionsCol();
    return await questionsCol.countDocuments(filter);
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

  /**
   * Toggles or sets saved state on a quiz, with optional title update.
   */
  static async saveQuiz(userId: string, quizId: string, isSaved: boolean = true, customTitle?: string) {
    const quizzesCol = await getQuizzesCol();
    let quiz = null;
    try {
      quiz = await quizzesCol.findOne({ _id: toObjectId(quizId), userId });
    } catch {
      // Non-fatal if invalid ObjectId format
    }

    if (!quiz) {
      // If quizId points to an attempt, find the attempt and create a quiz from it to save!
      const attemptsCol = await getQuizAttemptsCol();
      let attempt = null;
      try {
        attempt = await attemptsCol.findOne({ _id: toObjectId(quizId), userId });
      } catch {}

      if (attempt) {
        if (attempt.quizId) {
          try {
            const linkedQuiz = await quizzesCol.findOne({ _id: toObjectId(attempt.quizId), userId });
            if (linkedQuiz) {
              const updateFields: any = {
                isSaved,
                savedAt: isSaved ? new Date() : null,
                updatedAt: new Date(),
              };
              if (customTitle?.trim()) updateFields.title = customTitle.trim();
              await quizzesCol.updateOne({ _id: linkedQuiz._id }, { $set: updateFields });
              const updated = await quizzesCol.findOne({ _id: linkedQuiz._id });
              return formatDoc(updated);
            }
          } catch {}
        }

        const now = new Date();
        const newQuizDoc: any = {
          userId,
          title: customTitle?.trim() || attempt.title || "Saved Quiz",
          mode: attempt.mode,
          timeLimitMinutes: null,
          shuffleQuestions: true,
          shuffleOptions: true,
          showExplanations: true,
          questionIds: attempt.answers.map((a: any) => a.questionId),
          totalQuestions: attempt.totalQuestions || attempt.answers.length,
          isSaved,
          savedAt: isSaved ? now : null,
          createdAt: now,
          updatedAt: now,
        };
        const res = await quizzesCol.insertOne(newQuizDoc);
        await attemptsCol.updateOne({ _id: attempt._id }, { $set: { quizId: res.insertedId.toString() } });
        return formatDoc({ ...newQuizDoc, _id: res.insertedId });
      }
      throw new Error("Quiz not found or unauthorized");
    }

    const updateFields: any = {
      isSaved,
      savedAt: isSaved ? new Date() : null,
      updatedAt: new Date(),
    };
    if (customTitle?.trim()) {
      updateFields.title = customTitle.trim();
    }

    await quizzesCol.updateOne({ _id: quiz._id }, { $set: updateFields });
    const updated = await quizzesCol.findOne({ _id: quiz._id });
    return formatDoc(updated);
  }

  /**
   * Retrieves all saved quizzes for the user along with attempt statistics.
   */
  static async getSavedQuizzes(userId: string) {
    const quizzesCol = await getQuizzesCol();
    const attemptsCol = await getQuizAttemptsCol();

    const savedQuizzes = await quizzesCol
      .find({ userId, isSaved: true })
      .sort({ savedAt: -1, createdAt: -1 })
      .toArray();

    if (savedQuizzes.length === 0) return [];

    const quizIds = savedQuizzes.map((q) => q._id.toString());
    const attempts = await attemptsCol
      .find({ userId, quizId: { $in: quizIds } })
      .project({ quizId: 1, score: 1, accuracy: 1, totalQuestions: 1, completedAt: 1 })
      .sort({ completedAt: -1 })
      .toArray();

    const statsMap = new Map<string, { attemptsCount: number; bestAccuracy: number; lastAttemptedAt: Date | null }>();
    for (const att of attempts) {
      if (!att.quizId) continue;
      const cur = statsMap.get(att.quizId) || { attemptsCount: 0, bestAccuracy: 0, lastAttemptedAt: null };
      cur.attemptsCount++;
      if (att.accuracy > cur.bestAccuracy) cur.bestAccuracy = att.accuracy;
      if (!cur.lastAttemptedAt && att.completedAt) cur.lastAttemptedAt = att.completedAt;
      statsMap.set(att.quizId, cur);
    }

    return savedQuizzes.map((q) => {
      const qId = q._id.toString();
      const stats = statsMap.get(qId) || { attemptsCount: 0, bestAccuracy: 0, lastAttemptedAt: null };
      return {
        ...formatDoc(q),
        attemptsCount: stats.attemptsCount,
        bestAccuracy: stats.bestAccuracy,
        lastAttemptedAt: stats.lastAttemptedAt,
      };
    });
  }

  /**
   * Prepares or clones a quiz for retaking, ensuring a valid quiz exists.
   */
  static async retakeQuiz(userId: string, quizOrAttemptId: string) {
    const quizzesCol = await getQuizzesCol();
    try {
      const existing = await quizzesCol.findOne({ _id: toObjectId(quizOrAttemptId), userId });
      if (existing) {
        return { quizId: existing._id.toString() };
      }
    } catch {}

    const attemptsCol = await getQuizAttemptsCol();
    let attempt = null;
    try {
      attempt = await attemptsCol.findOne({ _id: toObjectId(quizOrAttemptId), userId });
    } catch {}

    if (attempt) {
      if (attempt.quizId) {
        try {
          const linkedQuiz = await quizzesCol.findOne({ _id: toObjectId(attempt.quizId), userId });
          if (linkedQuiz) {
            return { quizId: linkedQuiz._id.toString() };
          }
        } catch {}
      }

      // Recreate quiz from attempt answers
      const now = new Date();
      const newQuizDoc: any = {
        userId,
        title: attempt.title || "Retake Quiz",
        mode: attempt.mode,
        timeLimitMinutes: null,
        shuffleQuestions: true,
        shuffleOptions: true,
        showExplanations: true,
        questionIds: attempt.answers.map((a: any) => a.questionId),
        totalQuestions: attempt.totalQuestions || attempt.answers.length,
        isSaved: false,
        savedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      const res = await quizzesCol.insertOne(newQuizDoc);
      return { quizId: res.insertedId.toString() };
    }

    throw new Error("Quiz or attempt not found");
  }
}
