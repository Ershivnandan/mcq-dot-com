import {
  getQuestionsCol,
  getTopicsCol,
  getCategoriesCol,
  getQuestionProgressCol,
  getTagsCol,
  toObjectId,
  formatDoc,
} from "@/server/db";

export interface ImportSummary {
  imported: number;
  skipped: number;
  duplicates: number;
  invalid: number;
  dateHeadersFound: number;
  topicsCreated: string[];
}

export class ImportExportService {
  /**
   * Helper to parse human date header strings like:
   * "📋 1 May 2026 📋" or "🟪🟪... 3 June 2026 ...🟪" or "12-13 July 2026"
   */
  static extractDateFromHeader(text: string): Date | null {
    if (!text) return null;
    const match = text.match(/(\d+(?:-\d+)?)\s+([A-Za-z]+)\s+(\d{4})/);
    if (match) {
      const day = match[1].split("-")[0];
      const month = match[2];
      const year = match[3];
      const d = new Date(`${month} ${day}, ${year}`);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  /**
   * Imports the existing mcq_backup_new.json file or user JSON backup.
   */
  static async importBackupJson(userId: string, rawJson: any): Promise<ImportSummary> {
    const summary: ImportSummary = {
      imported: 0,
      skipped: 0,
      duplicates: 0,
      invalid: 0,
      dateHeadersFound: 0,
      topicsCreated: [],
    };

    if (!rawJson || !Array.isArray(rawJson.folders)) {
      throw new Error("Invalid backup format: missing 'folders' array.");
    }

    const [questionsCol, topicsCol, categoriesCol, progressCol] = await Promise.all([
      getQuestionsCol(),
      getTopicsCol(),
      getCategoriesCol(),
      getQuestionProgressCol(),
    ]);

    for (const folder of rawJson.folders) {
      const folderName = (folder.name || "").trim();
      const questionsList = folder.questions || [];

      if (!folderName || questionsList.length === 0) {
        summary.skipped += questionsList.length;
        continue;
      }

      const isImportantFolder = folderName.toLowerCase() === "important";

      // Determine topic/category
      let topicName = folderName;
      if (["May 📜", "June📜", "July 📜", "August", "September"].includes(folderName)) {
        topicName = "Current Affairs";
      }

      const slug = topicName.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "topic";
      const now = new Date();
      const topic = await topicsCol.findOneAndUpdate(
        { userId, name: topicName },
        {
          $setOnInsert: {
            userId,
            name: topicName,
            slug,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      const topicId = topic?._id?.toString() || null;

      if (!summary.topicsCreated.includes(topicName)) {
        summary.topicsCreated.push(topicName);
      }

      let categoryId: string | null = null;
      if (topicName !== folderName) {
        const cleanCatName = folderName.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
        const catSlug = cleanCatName.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "category";
        const category = await categoriesCol.findOneAndUpdate(
          { userId, name: cleanCatName },
          {
            $setOnInsert: {
              userId,
              name: cleanCatName,
              slug: catSlug,
              topicId,
              createdAt: now,
              updatedAt: now,
            },
          },
          { upsert: true, returnDocument: "after" }
        );
        categoryId = category?._id?.toString() || null;
      }

      let currentSectionDate: Date | null = null;

      for (const item of questionsList) {
        const qText = (item.q || "").trim();

        // Check if item is a section header or empty divider (0 options)
        if (!item.opts || item.opts.length === 0) {
          const parsedDate = this.extractDateFromHeader(qText);
          if (parsedDate) {
            currentSectionDate = parsedDate;
            summary.dateHeadersFound++;
          } else {
            summary.skipped++;
          }
          continue;
        }

        // Validate question options
        if (item.opts.length < 2) {
          summary.invalid++;
          continue;
        }

        // Build options
        const ansIndex = typeof item.ans === "number" ? item.ans : 0;
        const options = item.opts.map((optText: string, idx: number) => ({
          id: `opt_${idx + 1}`,
          optionText: String(optText).trim(),
          optionOrder: idx,
          isCorrect: idx === ansIndex,
        }));

        const isStarred = Boolean(item.starred) || isImportantFolder;

        const questionDoc = {
          userId,
          questionText: qText,
          explanation: item.explanation || null,
          difficulty: "MEDIUM" as const,
          questionDate: currentSectionDate || new Date(),
          source: folderName,
          isFavorite: isStarred,
          isArchived: false,
          topicId,
          categoryId,
          tagIds: [],
          options,
          createdAt: now,
          updatedAt: now,
        };

        const res = await questionsCol.insertOne(questionDoc);
        const qId = res.insertedId.toString();

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

        summary.imported++;
      }
    }

    return summary;
  }

  /**
   * Exports questions to a portable JSON backup.
   */
  static async exportQuestionsJson(userId: string, filter?: { topicId?: string }) {
    const questionsCol = await getQuestionsCol();
    const query: any = { userId };
    if (filter?.topicId) query.topicId = filter.topicId;

    const rawQuestions = await questionsCol.find(query).sort({ createdAt: 1 }).toArray();

    const [topicsCol, categoriesCol] = await Promise.all([
      getTopicsCol(),
      getCategoriesCol(),
    ]);

    const topicIds = rawQuestions.map((q) => q.topicId).filter((id): id is string => Boolean(id)).map(toObjectId);
    const categoryIds = rawQuestions.map((q) => q.categoryId).filter((id): id is string => Boolean(id)).map(toObjectId);

    const [topics, categories] = await Promise.all([
      topicsCol.find({ _id: { $in: topicIds } }).toArray(),
      categoriesCol.find({ _id: { $in: categoryIds } }).toArray(),
    ]);

    const topicMap = new Map(topics.map((t) => [t._id.toString(), t.name]));
    const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]));

    return {
      exportedAt: new Date().toISOString(),
      count: rawQuestions.length,
      questions: rawQuestions.map((q) => ({
        id: q._id.toString(),
        question: q.questionText,
        explanation: q.explanation,
        difficulty: q.difficulty,
        questionDate: q.questionDate,
        topic: q.topicId ? topicMap.get(q.topicId) || null : null,
        category: q.categoryId ? catMap.get(q.categoryId) || null : null,
        tags: [],
        isFavorite: q.isFavorite,
        options: q.options.map((o) => ({
          text: o.optionText,
          isCorrect: o.isCorrect,
        })),
      })),
    };
  }
}
