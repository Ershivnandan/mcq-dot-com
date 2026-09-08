import { prisma } from "@/server/db";

export class SpacedRepetitionService {
  /**
   * Applies the SuperMemo SM-2 algorithm to update a question's review schedule and metrics.
   */
  static async recordQuestionAttempt(
    userId: string,
    questionId: string,
    isCorrect: boolean,
    timeSpentSeconds: number = 0
  ) {
    const existing = await prisma.questionProgress.findUnique({
      where: { questionId },
    });

    const now = new Date();
    const currentStreak = isCorrect ? ((existing?.currentStreak || 0) + 1) : 0;
    const attemptCount = (existing?.attemptCount || 0) + 1;
    const correctCount = (existing?.correctCount || 0) + (isCorrect ? 1 : 0);
    const incorrectCount = (existing?.incorrectCount || 0) + (isCorrect ? 0 : 1);
    const accuracy = parseFloat(((correctCount / attemptCount) * 100).toFixed(2));

    // SM-2 calculation
    let easeFactor = existing?.easeFactor || 2.5;
    let intervalDays = existing?.intervalDays || 0;
    let masteryLevel = existing?.masteryLevel || 0;

    // Quality assessment (0 to 5)
    let quality = 0;
    if (isCorrect) {
      if (timeSpentSeconds < 15) quality = 5; // Fast and correct
      else if (timeSpentSeconds < 35) quality = 4; // Good recall
      else quality = 3; // Correct with effort
    } else {
      quality = 1; // Incorrect
    }

    if (quality >= 3) {
      if (intervalDays === 0) {
        intervalDays = 1;
      } else if (intervalDays === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      masteryLevel = Math.min(5, masteryLevel + 1);
    } else {
      intervalDays = 1;
      masteryLevel = Math.max(0, masteryLevel - 1);
    }

    // New ease factor = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

    return prisma.questionProgress.upsert({
      where: { questionId },
      create: {
        userId,
        questionId,
        attemptCount,
        correctCount,
        incorrectCount,
        accuracy,
        currentStreak,
        lastAttemptAt: now,
        lastCorrectAt: isCorrect ? now : null,
        nextReviewAt,
        masteryLevel,
        easeFactor,
        intervalDays,
      },
      update: {
        attemptCount,
        correctCount,
        incorrectCount,
        accuracy,
        currentStreak,
        lastAttemptAt: now,
        ...(isCorrect ? { lastCorrectAt: now } : {}),
        nextReviewAt,
        masteryLevel,
        easeFactor,
        intervalDays,
      },
    });
  }

  /**
   * Retrieves questions due for revision today for the user.
   */
  static async getQuestionsDueToday(userId: string, limit: number = 20) {
    const now = new Date();
    const progressList = await prisma.questionProgress.findMany({
      where: {
        userId,
        OR: [
          { nextReviewAt: { lte: now } },
          { nextReviewAt: null },
          { accuracy: { lt: 60 }, attemptCount: { gt: 0 } },
        ],
      },
      take: limit,
      include: {
        question: {
          include: {
            topic: true,
            category: true,
          },
        },
      },
      orderBy: [
        { nextReviewAt: "asc" },
        { accuracy: "asc" },
      ],
    });

    return progressList.map((p) => p.question).filter(Boolean);
  }
}
