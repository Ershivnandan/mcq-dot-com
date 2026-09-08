import { prisma } from "@/server/db";
import { z } from "zod";
import { QuestionInputSchema, QuestionQuerySchema } from "@/lib/validation/schemas";

export type QuestionInput = z.infer<typeof QuestionInputSchema>;
export type QuestionQuery = z.infer<typeof QuestionQuerySchema>;

export class QuestionService {
  /**
   * Retrieves a paginated list of questions for the authenticated user with multi-faceted filtering.
   */
  static async getQuestions(userId: string, query: QuestionQuery) {
    const where: any = { userId };

    // Favorite / Archived filters
    if (typeof query.isFavorite === "boolean") {
      where.isFavorite = query.isFavorite;
    }
    if (typeof query.isArchived === "boolean") {
      where.isArchived = query.isArchived;
    } else {
      // Default: hide archived unless requested
      where.isArchived = false;
    }

    // Specific filters
    if (query.topicId) where.topicId = query.topicId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.tagId) where.tagIds = { has: query.tagId };
    if (query.collectionId) where.collectionIds = { has: query.collectionId };

    // Date range filter on questionDate
    if (query.dateFrom || query.dateTo) {
      where.questionDate = {};
      if (query.dateFrom) where.questionDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.questionDate.lte = new Date(query.dateTo);
    }

    // Search query across questionText, explanation, notes, source
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { questionText: { contains: term, mode: "insensitive" } },
        { explanation: { contains: term, mode: "insensitive" } },
        { notes: { contains: term, mode: "insensitive" } },
        { source: { contains: term, mode: "insensitive" } },
      ];
    }

    // Sorting
    let orderBy: any = { createdAt: "desc" };
    if (query.sortBy === "questionDate") {
      orderBy = { questionDate: query.sortOrder };
    } else if (query.sortBy === "updatedAt") {
      orderBy = { updatedAt: query.sortOrder };
    } else if (query.sortBy === "alphabetical") {
      orderBy = { questionText: query.sortOrder };
    } else if (query.sortBy === "difficulty") {
      orderBy = { difficulty: query.sortOrder };
    } else {
      orderBy = { createdAt: query.sortOrder };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, questions] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          topic: true,
          category: true,
          tags: true,
          progress: true,
        },
      }),
    ]);

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
   * Retrieves a single question by ID ensuring user ownership.
   */
  static async getQuestionById(userId: string, questionId: string) {
    const question = await prisma.question.findFirst({
      where: { id: questionId, userId },
      include: {
        topic: true,
        category: true,
        tags: true,
        collections: true,
        progress: true,
      },
    });

    if (!question) {
      throw new Error("Question not found or unauthorized");
    }

    return question;
  }

  /**
   * Creates a new question with embedded options.
   */
  static async createQuestion(userId: string, data: QuestionInput) {
    const questionDate = data.questionDate ? new Date(data.questionDate) : new Date();

    const created = await prisma.question.create({
      data: {
        userId,
        questionText: data.questionText,
        explanation: data.explanation || null,
        difficulty: data.difficulty,
        questionDate,
        source: data.source || null,
        notes: data.notes || null,
        isFavorite: data.isFavorite,
        isArchived: data.isArchived,
        topicId: data.topicId || null,
        categoryId: data.categoryId || null,
        tagIds: data.tagIds || [],
        collectionIds: data.collectionIds || [],
        options: data.options.map((opt, idx) => ({
          id: opt.id || `opt_${idx + 1}`,
          optionText: opt.optionText,
          optionOrder: opt.optionOrder ?? idx,
          isCorrect: opt.isCorrect,
        })),
        progress: {
          create: {
            userId,
            attemptCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            accuracy: 0,
            masteryLevel: 0,
            easeFactor: 2.5,
            intervalDays: 0,
          },
        },
      },
      include: {
        topic: true,
        category: true,
        tags: true,
      },
    });

    return created;
  }

  /**
   * Updates an existing question with embedded options.
   */
  static async updateQuestion(userId: string, questionId: string, data: QuestionInput) {
    await this.getQuestionById(userId, questionId);

    const questionDate = data.questionDate ? new Date(data.questionDate) : undefined;

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        questionText: data.questionText,
        explanation: data.explanation || null,
        difficulty: data.difficulty,
        ...(questionDate ? { questionDate } : {}),
        source: data.source || null,
        notes: data.notes || null,
        isFavorite: data.isFavorite,
        isArchived: data.isArchived,
        topicId: data.topicId || null,
        categoryId: data.categoryId || null,
        tagIds: data.tagIds || [],
        collectionIds: data.collectionIds || [],
        options: data.options.map((opt, idx) => ({
          id: opt.id || `opt_${idx + 1}`,
          optionText: opt.optionText,
          optionOrder: opt.optionOrder ?? idx,
          isCorrect: opt.isCorrect,
        })),
      },
      include: {
        topic: true,
        category: true,
        tags: true,
      },
    });

    return updated;
  }

  /**
   * Deletes a question owned by the user.
   */
  static async deleteQuestion(userId: string, questionId: string) {
    await this.getQuestionById(userId, questionId);
    return prisma.question.delete({
      where: { id: questionId },
    });
  }

  /**
   * Toggles favorite status on a question.
   */
  static async toggleFavorite(userId: string, questionId: string) {
    const q = await this.getQuestionById(userId, questionId);
    return prisma.question.update({
      where: { id: questionId },
      data: { isFavorite: !q.isFavorite },
    });
  }

  /**
   * Performs bulk operations across selected questions.
   */
  static async bulkAction(userId: string, questionIds: string[], action: string, payload?: any) {
    const filter = { id: { in: questionIds }, userId };

    switch (action) {
      case "delete":
        return prisma.question.deleteMany({ where: filter });
      case "favorite":
        return prisma.question.updateMany({ where: filter, data: { isFavorite: true } });
      case "unfavorite":
        return prisma.question.updateMany({ where: filter, data: { isFavorite: false } });
      case "archive":
        return prisma.question.updateMany({ where: filter, data: { isArchived: true } });
      case "restore":
        return prisma.question.updateMany({ where: filter, data: { isArchived: false } });
      case "set_difficulty":
        if (payload?.difficulty) {
          return prisma.question.updateMany({ where: filter, data: { difficulty: payload.difficulty } });
        }
        break;
      case "set_topic":
        return prisma.question.updateMany({ where: filter, data: { topicId: payload?.topicId || null } });
      case "set_category":
        return prisma.question.updateMany({ where: filter, data: { categoryId: payload?.categoryId || null } });
      case "add_to_collection":
        if (payload?.collectionId) {
          const colId = payload.collectionId;
          const questions = await prisma.question.findMany({ where: filter, select: { id: true, collectionIds: true } });
          const updates = questions.map((q) => {
            const nextCols = Array.from(new Set([...q.collectionIds, colId]));
            return prisma.question.update({
              where: { id: q.id },
              data: { collectionIds: nextCols },
            });
          });
          await Promise.all(updates);
          return { count: updates.length };
        }
        break;
    }

    return { count: 0 };
  }
}
