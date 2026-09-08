import { prisma } from "@/server/db";
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
      questionIds = dueQuestions.map((q) => q.id);
    } else {
      const where: any = { userId, isArchived: false };

      if (data.topicId) where.topicId = data.topicId;
      if (data.categoryId) where.categoryId = data.categoryId;
      if (data.collectionId) where.collectionIds = { has: data.collectionId };
      if (data.difficulty) where.difficulty = data.difficulty;
      if (data.tagId) where.tagIds = { has: data.tagId };
      if (data.onlyFavorites) where.isFavorite = true;

      // If onlyIncorrect, join with questionProgress
      if (data.onlyIncorrect) {
        const incorrectProgress = await prisma.questionProgress.findMany({
          where: { userId, incorrectCount: { gt: 0 } },
          select: { questionId: true },
        });
        where.id = { in: incorrectProgress.map((p) => p.questionId) };
      }

      const availableQuestions = await prisma.question.findMany({
        where,
        select: { id: true },
        take: 300,
      });

      let ids = availableQuestions.map((q) => q.id);
      if (data.shuffleQuestions) {
        ids = ids.sort(() => Math.random() - 0.5);
      }

      questionIds = ids.slice(0, data.questionCount);
    }

    if (questionIds.length === 0) {
      throw new Error("No questions match the selected criteria.");
    }

    const quiz = await prisma.quiz.create({
      data: {
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
      },
    });

    return quiz;
  }

  /**
   * Retrieves a quiz with its questions and options.
   */
  static async getQuiz(userId: string, quizId: string) {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, userId },
    });

    if (!quiz) throw new Error("Quiz not found or unauthorized");

    const questions = await prisma.question.findMany({
      where: { id: { in: quiz.questionIds }, userId },
      include: {
        topic: true,
        category: true,
      },
    });

    // Sort questions in quiz questionIds order
    const orderedQuestions = quiz.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as typeof questions;

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
      quiz,
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

    // Validate and score each answer
    const scoredAnswers = await Promise.all(
      data.answers.map(async (ans) => {
        const question = await prisma.question.findUnique({
          where: { id: ans.questionId },
          select: { options: true },
        });

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

    const attempt = await prisma.quizAttempt.create({
      data: {
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
      },
    });

    return attempt;
  }

  /**
   * Gets attempts history for the user.
   */
  static async getAttempts(userId: string, limit: number = 20) {
    return prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: limit,
      include: {
        quiz: {
          select: { title: true },
        },
      },
    });
  }

  /**
   * Gets a specific attempt result with full breakdown.
   */
  static async getAttemptById(userId: string, attemptId: string) {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        quiz: true,
      },
    });

    if (!attempt) throw new Error("Attempt not found");

    const questionIds = attempt.answers.map((a) => a.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: {
        topic: true,
        category: true,
      },
    });

    const detailedAnswers = attempt.answers.map((ans) => {
      const q = questions.find((item) => item.id === ans.questionId);
      const selectedOption = q?.options.find((o) => o.id === ans.selectedOptionId);
      const correctOption = q?.options.find((o) => o.isCorrect);

      return {
        ...ans,
        questionText: q?.questionText || "",
        explanation: q?.explanation || "",
        difficulty: q?.difficulty || "MEDIUM",
        topic: q?.topic?.name || "General",
        category: q?.category?.name || "General",
        options: q?.options || [],
        selectedOptionText: selectedOption?.optionText || "Unanswered",
        correctOptionText: correctOption?.optionText || "",
      };
    });

    return {
      attempt,
      answers: detailedAnswers,
    };
  }
}
