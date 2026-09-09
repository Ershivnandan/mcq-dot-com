import {
  getQuestionsCol,
  getTopicsCol,
  getQuestionProgressCol,
  toObjectId,
  formatDoc,
  formatDocs,
} from "@/server/db";
import { z } from "zod";
import { QuestionInputSchema, QuestionQuerySchema } from "@/lib/validation/schemas";
import { ObjectId } from "mongodb";

export type QuestionInput = z.infer<typeof QuestionInputSchema>;
export type QuestionQuery = z.infer<typeof QuestionQuerySchema>;

export class QuestionService {
  /**
   * Retrieves a paginated list of questions for the authenticated user with multi-faceted filtering.
   */
  static async getQuestions(userId: string, query: QuestionQuery) {
    const filter: any = { userId };

    // Favorite / Archived filters
    if (typeof query.isFavorite === "boolean") {
      filter.isFavorite = query.isFavorite;
    }
    if (typeof query.isArchived === "boolean") {
      filter.isArchived = query.isArchived;
    } else {
      filter.isArchived = false;
    }

    // Specific filters
    if (query.topicId) filter.topicId = query.topicId;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.tagId) filter.tagIds = query.tagId;


    // Date range filter on questionDate
    if (query.dateFrom || query.dateTo) {
      filter.questionDate = {};
      if (query.dateFrom) filter.questionDate.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.questionDate.$lte = new Date(query.dateTo);
    }

    // Search query across questionText, explanation, notes, source
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      filter.$or = [
        { questionText: { $regex: term, $options: "i" } },
        { explanation: { $regex: term, $options: "i" } },
        { notes: { $regex: term, $options: "i" } },
        { source: { $regex: term, $options: "i" } },
      ];
    }

    // Sorting
    const sortObj: any = {};
    const dir = query.sortOrder === "asc" ? 1 : -1;
    if (query.sortBy === "questionDate") {
      sortObj.questionDate = dir;
    } else if (query.sortBy === "updatedAt") {
      sortObj.updatedAt = dir;
    } else if (query.sortBy === "alphabetical") {
      sortObj.questionText = dir;
    } else if (query.sortBy === "difficulty") {
      sortObj.difficulty = dir;
    } else {
      sortObj.createdAt = dir;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const questionsCol = await getQuestionsCol();
    const [total, rawQuestions] = await Promise.all([
      questionsCol.countDocuments(filter),
      questionsCol.find(filter).sort(sortObj).skip(skip).limit(limit).toArray(),
    ]);

    // Populate topics, categories, progress
    const questions = await this.populateQuestionRelations(userId, rawQuestions);

    return {
      questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Helper to attach topic, category, tags, and progress to questions
   */
  private static async populateQuestionRelations(userId: string, questions: any[]) {
    if (questions.length === 0) return [];

    const topicIds = questions.map((q) => q.topicId).filter(Boolean).map(toObjectId);
    const questionStringIds = questions.map((q) => q._id?.toString() || q.id);

    const [topicsCol, progressCol] = await Promise.all([
      getTopicsCol(),
      getQuestionProgressCol(),
    ]);

    const [topics, progressList] = await Promise.all([
      topicsCol.find({ _id: { $in: topicIds } }).toArray(),
      progressCol.find({ questionId: { $in: questionStringIds }, userId }).toArray(),
    ]);

    const topicMap = new Map(topics.map((t) => [t._id?.toString(), t]));
    const progressMap = new Map(progressList.map((p) => [p.questionId, p]));

    return questions.map((q) => {
      const qId = q._id?.toString() || q.id;
      return {
        ...q,
        id: qId,
        topic: q.topicId ? formatDoc(topicMap.get(q.topicId) || null) : null,
        progress: formatDoc(progressMap.get(qId) || null),
      };
    });
  }


  /**
   * Retrieves a single question by ID ensuring user ownership.
   */
  static async getQuestionById(userId: string, questionId: string) {
    const col = await getQuestionsCol();
    const question = await col.findOne({ _id: toObjectId(questionId), userId });

    if (!question) {
      throw new Error("Question not found or unauthorized");
    }

    const [populated] = await this.populateQuestionRelations(userId, [question]);
    return populated;
  }

  /**
   * Creates a new question with embedded options.
   */
  static async createQuestion(userId: string, data: QuestionInput) {
    const questionDate = data.questionDate ? new Date(data.questionDate) : new Date();
    const now = new Date();

    const options = data.options.map((opt, idx) => ({
      id: opt.id || `opt_${idx + 1}`,
      optionText: opt.optionText,
      optionOrder: opt.optionOrder ?? idx,
      isCorrect: opt.isCorrect,
    }));

    const questionDoc: any = {
      userId,
      questionText: data.questionText,
      explanation: data.explanation || null,
      difficulty: data.difficulty,
      questionDate,
      source: data.source || null,
      notes: data.notes || null,
      isFavorite: data.isFavorite ?? false,
      isArchived: data.isArchived ?? false,
      topicId: data.topicId || null,
      tagIds: data.tagIds || [],
      options,
      createdAt: now,
      updatedAt: now,
    };

    const questionsCol = await getQuestionsCol();
    const res = await questionsCol.insertOne(questionDoc);
    const qId = res.insertedId.toString();

    // Create initial question progress
    const progressCol = await getQuestionProgressCol();
    await progressCol.insertOne({
      userId,
      questionId: qId,
      attemptCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      accuracy: 0,
      currentStreak: 0,
      masteryLevel: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      createdAt: now,
      updatedAt: now,
    });

    const [created] = await this.populateQuestionRelations(userId, [{ ...questionDoc, _id: res.insertedId }]);
    return created;
  }

  /**
   * Updates an existing question with embedded options.
   */
  static async updateQuestion(userId: string, questionId: string, data: QuestionInput) {
    await this.getQuestionById(userId, questionId);

    const questionDate = data.questionDate ? new Date(data.questionDate) : undefined;
    const now = new Date();

    const options = data.options.map((opt, idx) => ({
      id: opt.id || `opt_${idx + 1}`,
      optionText: opt.optionText,
      optionOrder: opt.optionOrder ?? idx,
      isCorrect: opt.isCorrect,
    }));

    const updateFields: any = {
      questionText: data.questionText,
      explanation: data.explanation || null,
      difficulty: data.difficulty,
      source: data.source || null,
      notes: data.notes || null,
      isFavorite: data.isFavorite ?? false,
      isArchived: data.isArchived ?? false,
      topicId: data.topicId || null,
      tagIds: data.tagIds || [],
      options,
      updatedAt: now,
    };

    if (questionDate) {
      updateFields.questionDate = questionDate;
    }

    const col = await getQuestionsCol();
    await col.updateOne(
      { _id: toObjectId(questionId), userId },
      { $set: updateFields }
    );

    return this.getQuestionById(userId, questionId);
  }

  /**
   * Deletes a question owned by the user.
   */
  static async deleteQuestion(userId: string, questionId: string) {
    await this.getQuestionById(userId, questionId);
    const [qCol, pCol] = await Promise.all([getQuestionsCol(), getQuestionProgressCol()]);

    await Promise.all([
      qCol.deleteOne({ _id: toObjectId(questionId), userId }),
      pCol.deleteMany({ questionId }),
    ]);

    return true;
  }

  /**
   * Toggles favorite status on a question.
   */
  static async toggleFavorite(userId: string, questionId: string) {
    const q = await this.getQuestionById(userId, questionId);
    const col = await getQuestionsCol();
    await col.updateOne(
      { _id: toObjectId(questionId), userId },
      { $set: { isFavorite: !q.isFavorite, updatedAt: new Date() } }
    );
    return { ...q, isFavorite: !q.isFavorite };
  }

  /**
   * Performs bulk operations across selected questions.
   */
  static async bulkAction(userId: string, questionIds: string[], action: string, payload?: any) {
    const objectIds = questionIds.map(toObjectId);
    const filter = { _id: { $in: objectIds }, userId };
    const col = await getQuestionsCol();

    switch (action) {
      case "delete": {
        const res = await col.deleteMany(filter);
        const pCol = await getQuestionProgressCol();
        await pCol.deleteMany({ questionId: { $in: questionIds } });
        return { count: res.deletedCount };
      }
      case "favorite": {
        const res = await col.updateMany(filter, { $set: { isFavorite: true, updatedAt: new Date() } });
        return { count: res.modifiedCount };
      }
      case "unfavorite": {
        const res = await col.updateMany(filter, { $set: { isFavorite: false, updatedAt: new Date() } });
        return { count: res.modifiedCount };
      }
      case "archive": {
        const res = await col.updateMany(filter, { $set: { isArchived: true, updatedAt: new Date() } });
        return { count: res.modifiedCount };
      }
      case "restore": {
        const res = await col.updateMany(filter, { $set: { isArchived: false, updatedAt: new Date() } });
        return { count: res.modifiedCount };
      }
      case "set_difficulty":
        if (payload?.difficulty) {
          const res = await col.updateMany(filter, { $set: { difficulty: payload.difficulty, updatedAt: new Date() } });
          return { count: res.modifiedCount };
        }
        break;
      case "set_topic": {
        const res = await col.updateMany(filter, { $set: { topicId: payload?.topicId || null, updatedAt: new Date() } });
        return { count: res.modifiedCount };
      }
    }

    return { count: 0 };
  }
}
