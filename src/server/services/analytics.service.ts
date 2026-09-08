import {
  getQuestionsCol,
  getQuizAttemptsCol,
  getQuestionProgressCol,
  getTopicsCol,
  toObjectId,
  formatDocs,
} from "@/server/db";

export class AnalyticsService {
  /**
   * Computes comprehensive analytics dashboard metrics for the user.
   */
  static async getDashboardMetrics(userId: string) {
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
    ] = await Promise.all([
      questionsCol.countDocuments({ userId, isArchived: false }),
      questionsCol.countDocuments({ userId, isFavorite: true, isArchived: false }),
      questionsCol.countDocuments({ userId, isArchived: true }),
      attemptsCol.find({ userId }).sort({ completedAt: -1 }).limit(50).toArray(),
      progressCol.find({ userId }).toArray(),
      topicsCol.find({ userId }).project({ _id: 1, name: 1 }).toArray(),
    ]);

    // Attach questions difficulty and topic to progress items
    const questionIds = progressItems.map((p) => toObjectId(p.questionId));
    const questions = await questionsCol
      .find({ _id: { $in: questionIds }, userId })
      .project({ _id: 1, topicId: 1, difficulty: 1 })
      .toArray();

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // Overall accuracy
    const practicedCount = progressItems.filter((p) => p.attemptCount > 0).length;
    const totalAttempts = progressItems.reduce((acc, curr) => acc + curr.attemptCount, 0);
    const totalCorrect = progressItems.reduce((acc, curr) => acc + curr.correctCount, 0);
    const overallAccuracy = totalAttempts > 0 ? parseFloat(((totalCorrect / totalAttempts) * 100).toFixed(1)) : 0;

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
    const topicMap = new Map(topics.map((t) => [t._id.toString(), t.name]));
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

    return {
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
      topicStats: topicStats.slice(0, 10),
      strongestTopics,
      weakestTopics,
      recentActivity,
      recentQuizzes: formatDocs(quizAttempts.slice(0, 5)),
    };
  }
}
