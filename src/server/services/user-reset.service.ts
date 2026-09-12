import {
  getQuestionsCol,
  getQuestionProgressCol,
  getAIDraftsCol,
  getQuizzesCol,
  getQuizAttemptsCol,
  getTopicsCol,
  getCategoriesCol,
  getTagsCol,
  getAIUsageLogsCol,
  getAIProviderConfigsCol,
} from "@/server/db";

export interface UserDataCounts {
  questionCount: number;
  progressCount: number;
  draftCount: number;
  quizCount: number;
  attemptCount: number;
  topicCount: number;
  categoryCount: number;
  tagCount: number;
  usageLogCount: number;
  totalItems: number;
}

export interface ResetOptions {
  wipeAIKeys?: boolean;
}

export class UserResetService {
  /**
   * Returns current statistics of data owned by the user.
   * Useful for displaying exact counts in confirmation warning dialogs.
   */
  static async getUserDataCounts(userId: string): Promise<UserDataCounts> {
    const [
      qCol,
      pCol,
      dCol,
      qzCol,
      attCol,
      topCol,
      catCol,
      tagCol,
      logCol,
    ] = await Promise.all([
      getQuestionsCol(),
      getQuestionProgressCol(),
      getAIDraftsCol(),
      getQuizzesCol(),
      getQuizAttemptsCol(),
      getTopicsCol(),
      getCategoriesCol(),
      getTagsCol(),
      getAIUsageLogsCol(),
    ]);

    const [
      questionCount,
      progressCount,
      draftCount,
      quizCount,
      attemptCount,
      topicCount,
      categoryCount,
      tagCount,
      usageLogCount,
    ] = await Promise.all([
      qCol.countDocuments({ userId }),
      pCol.countDocuments({ userId }),
      dCol.countDocuments({ userId }),
      qzCol.countDocuments({ userId }),
      attCol.countDocuments({ userId }),
      topCol.countDocuments({ userId }),
      catCol.countDocuments({ userId }),
      tagCol.countDocuments({ userId }),
      logCol.countDocuments({ userId }),
    ]);

    const totalItems =
      questionCount +
      progressCount +
      draftCount +
      quizCount +
      attemptCount +
      topicCount +
      categoryCount +
      tagCount;

    return {
      questionCount,
      progressCount,
      draftCount,
      quizCount,
      attemptCount,
      topicCount,
      categoryCount,
      tagCount,
      usageLogCount,
      totalItems,
    };
  }

  /**
   * Hard-deletes all questions, study progress, and AI drafts owned by the user.
   * Cleans question references in quizzes.
   * Leaves taxonomy (topics, categories, tags) and quizzes intact.
   */
  static async wipeUserQuestions(userId: string) {
    const [qCol, pCol, dCol, qzCol] = await Promise.all([
      getQuestionsCol(),
      getQuestionProgressCol(),
      getAIDraftsCol(),
      getQuizzesCol(),
    ]);

    const [qRes, pRes, dRes] = await Promise.all([
      qCol.deleteMany({ userId }),
      pCol.deleteMany({ userId }),
      dCol.deleteMany({ userId }),
      qzCol.updateMany({ userId }, { $set: { questionIds: [], updatedAt: new Date() } }),
    ]);

    return {
      success: true,
      questionsDeleted: qRes.deletedCount,
      progressDeleted: pRes.deletedCount,
      draftsDeleted: dRes.deletedCount,
    };
  }

  /**
   * Hard-deletes ALL content and study data associated with the user account:
   * questions, question_progress, ai_draft_questions, quizzes, quiz_attempts,
   * topics, categories, tags, and ai_usage_logs.
   *
   * Crucially, user credentials (users table) and active login tokens (sessions)
   * are preserved so the user remains authenticated and starts with a completely fresh slate.
   */
  static async resetUserData(userId: string, options: ResetOptions = {}) {
    const [
      qCol,
      pCol,
      dCol,
      qzCol,
      attCol,
      topCol,
      catCol,
      tagCol,
      logCol,
    ] = await Promise.all([
      getQuestionsCol(),
      getQuestionProgressCol(),
      getAIDraftsCol(),
      getQuizzesCol(),
      getQuizAttemptsCol(),
      getTopicsCol(),
      getCategoriesCol(),
      getTagsCol(),
      getAIUsageLogsCol(),
    ]);

    const deletePromises: Promise<any>[] = [
      qCol.deleteMany({ userId }),
      pCol.deleteMany({ userId }),
      dCol.deleteMany({ userId }),
      qzCol.deleteMany({ userId }),
      attCol.deleteMany({ userId }),
      topCol.deleteMany({ userId }),
      catCol.deleteMany({ userId }),
      tagCol.deleteMany({ userId }),
      logCol.deleteMany({ userId }),
    ];

    if (options.wipeAIKeys) {
      const keysCol = await getAIProviderConfigsCol();
      deletePromises.push(keysCol.deleteMany({ userId }));
    }

    const results = await Promise.all(deletePromises);

    return {
      success: true,
      questionsDeleted: results[0].deletedCount,
      progressDeleted: results[1].deletedCount,
      draftsDeleted: results[2].deletedCount,
      quizzesDeleted: results[3].deletedCount,
      attemptsDeleted: results[4].deletedCount,
      topicsDeleted: results[5].deletedCount,
      categoriesDeleted: results[6].deletedCount,
      tagsDeleted: results[7].deletedCount,
      logsDeleted: results[8].deletedCount,
      keysDeleted: options.wipeAIKeys ? results[9]?.deletedCount : 0,
    };
  }
}
