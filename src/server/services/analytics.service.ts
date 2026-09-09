import {
  getQuestionsCol,
  getQuizAttemptsCol,
  getQuestionProgressCol,
  getTopicsCol,
  toObjectId,
  formatDocs,
} from "@/server/db";

// In-memory metrics cache to ensure instant tab switching between Dashboard & Analytics
const metricsCache = new Map<string, { data: any; timestamp: number }>();
const METRICS_CACHE_TTL_MS = 25 * 1000; // 25 seconds

export class AnalyticsService {
  static invalidateUserMetrics(userId: string) {
    metricsCache.delete(userId);
  }

  /**
   * Computes comprehensive analytics dashboard metrics for the user.
   */
  static async getDashboardMetrics(userId: string) {
    const cached = metricsCache.get(userId);
    if (cached && Date.now() - cached.timestamp < METRICS_CACHE_TTL_MS) {
      return cached.data;
    }

    const [questionsCol, attemptsCol, progressCol, topicsCol] = await Promise.all([
      getQuestionsCol(),
      getQuizAttemptsCol(),
      getQuestionProgressCol(),
      getTopicsCol(),
    ]);

    const [
      totalQuestions,
      favoritesCount,
      archivedCount,
      quizAttempts,
      progressItems,
      topics,
      difficultyAgg,
      topicAgg,
    ] = await Promise.all([
      questionsCol.countDocuments({ userId, isArchived: false }),
      questionsCol.countDocuments({ userId, isFavorite: true, isArchived: false }),
      questionsCol.countDocuments({ userId, isArchived: true }),
      attemptsCol.find({ userId }).sort({ completedAt: -1 }).limit(50).toArray(),
      progressCol.find({ userId }).toArray(),
      topicsCol.find({ userId }).project({ _id: 1, name: 1 }).toArray(),
      questionsCol
        .aggregate([
          { $match: { userId, isArchived: false } },
          { $group: { _id: "$difficulty", count: { $sum: 1 } } },
        ])
        .toArray(),
      questionsCol
        .aggregate([
          { $match: { userId, isArchived: false } },
          { $group: { _id: "$topicId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ])
        .toArray(),
    ]);

    // Questions by difficulty distribution in the library
    const questionsByDifficulty: Record<string, number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };
    difficultyAgg.forEach((d: any) => {
      if (d._id && questionsByDifficulty[d._id] !== undefined) {
        questionsByDifficulty[d._id] = d.count;
      }
    });

    // Topic map for name lookups
    const topicMap = new Map(topics.map((t) => [t._id.toString(), t.name]));

    // Top questions count by topic
    const questionsByTopic = topicAgg.map((item: any) => ({
      name: (item._id && topicMap.get(item._id)) || "General",
      count: item.count,
    }));

    // Attach questions difficulty and topic only to attempted items for rapid rendering
    const attemptedItems = progressItems.filter((p) => p.attemptCount > 0);
    const questionIds = attemptedItems.map((p) => toObjectId(p.questionId));
    const questions =
      questionIds.length > 0
        ? await questionsCol
            .find({ _id: { $in: questionIds }, userId })
            .project({ _id: 1, topicId: 1, difficulty: 1 })
            .toArray()
        : [];

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // Overall accuracy
    const practicedCount = progressItems.filter((p) => p.attemptCount > 0).length;
    const totalAttempts = progressItems.reduce((acc, curr) => acc + curr.attemptCount, 0);
    const totalCorrect = progressItems.reduce((acc, curr) => acc + curr.correctCount, 0);
    const overallAccuracy = totalAttempts > 0 ? parseFloat(((totalCorrect / totalAttempts) * 100).toFixed(1)) : 0;

    // Mastery Breakdown
    const masteredCount = progressItems.filter(
      (p) => p.attemptCount > 0 && (p.intervalDays >= 21 || (p.masteryLevel && p.masteryLevel >= 4))
    ).length;
    const learningCount = progressItems.filter(
      (p) => p.attemptCount > 0 && !(p.intervalDays >= 21 || (p.masteryLevel && p.masteryLevel >= 4))
    ).length;
    const unattemptedCount = Math.max(0, totalQuestions - (masteredCount + learningCount));
    const totalForPct = Math.max(totalQuestions, 1);

    const masteryBreakdown = {
      mastered: masteredCount,
      learning: learningCount,
      unattempted: unattemptedCount,
      masteredPct: Math.round((masteredCount / totalForPct) * 100),
      learningPct: Math.round((learningCount / totalForPct) * 100),
      unattemptedPct: Math.round((unattemptedCount / totalForPct) * 100),
    };

    // Study streak (days with at least 1 attempt)
    const activeDates = new Set(
      quizAttempts.map((a) => a.completedAt.toISOString().slice(0, 10))
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (activeDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Performance by difficulty
    const difficultyStats: Record<string, { total: number; correct: number; accuracy: number }> = {
      EASY: { total: 0, correct: 0, accuracy: 0 },
      MEDIUM: { total: 0, correct: 0, accuracy: 0 },
      HARD: { total: 0, correct: 0, accuracy: 0 },
    };

    progressItems.forEach((p) => {
      const q = questionMap.get(p.questionId);
      const diff = q?.difficulty || "MEDIUM";
      if (difficultyStats[diff]) {
        difficultyStats[diff].total += p.attemptCount;
        difficultyStats[diff].correct += p.correctCount;
      }
    });

    Object.keys(difficultyStats).forEach((k) => {
      const s = difficultyStats[k];
      s.accuracy = s.total > 0 ? parseFloat(((s.correct / s.total) * 100).toFixed(1)) : 0;
    });

    // Topic performance
    const topicPerformance: Record<string, { name: string; attempts: number; correct: number; accuracy: number }> = {};

    progressItems.forEach((p) => {
      const q = questionMap.get(p.questionId);
      const topicName = (q?.topicId && topicMap.get(q.topicId)) || "General";
      if (!topicPerformance[topicName]) {
        topicPerformance[topicName] = { name: topicName, attempts: 0, correct: 0, accuracy: 0 };
      }
      topicPerformance[topicName].attempts += p.attemptCount;
      topicPerformance[topicName].correct += p.correctCount;
    });

    const topicStats = Object.values(topicPerformance)
      .map((t) => ({
        ...t,
        accuracy: t.attempts > 0 ? parseFloat(((t.correct / t.attempts) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts);

    const strongestTopics = [...topicStats]
      .filter((t) => t.attempts >= 3)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    const weakestTopics = [...topicStats]
      .filter((t) => t.attempts >= 3)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Recent attempts for activity chart (last 10)
    const recentActivity = quizAttempts
      .slice(0, 10)
      .reverse()
      .map((a) => ({
        date: a.completedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        accuracy: a.accuracy,
        score: a.score,
        total: a.totalQuestions,
      }));

    // Daily study activity over the last 7 days
    const weeklyActivity: Array<{ day: string; date: string; attempts: number; questions: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dayAttempts = quizAttempts.filter(
        (a) => a.completedAt.toISOString().slice(0, 10) === dateKey
      );
      const questionsCount = dayAttempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);

      weeklyActivity.push({
        day: dayLabel,
        date: dateLabel,
        attempts: dayAttempts.length,
        questions: questionsCount,
      });
    }

    const result = {
      overview: {
        totalQuestions,
        practicedCount,
        favoritesCount,
        archivedCount,
        quizAttemptsCount: quizAttempts.length,
        overallAccuracy,
        currentStreak: streak,
      },
      difficultyStats,
      questionsByDifficulty,
      questionsByTopic,
      masteryBreakdown,
      weeklyActivity,
      topicStats: topicStats.slice(0, 10),
      strongestTopics,
      weakestTopics,
      recentActivity,
      recentQuizzes: formatDocs(quizAttempts.slice(0, 5)),
    };

    metricsCache.set(userId, { data: result, timestamp: Date.now() });
    return result;
  }
}
