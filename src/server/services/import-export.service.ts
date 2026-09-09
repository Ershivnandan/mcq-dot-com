import {
  getQuestionsCol,
  getTopicsCol,
  getCategoriesCol,
  getQuestionProgressCol,
  getTagsCol,
  toObjectId,
  formatDoc,
} from "@/server/db";

import { ImportSummary, Difficulty } from "@/typings";
export type { ImportSummary };

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
   * Uses high-performance batch operations with insertMany to process thousands of questions
   * in seconds without hitting request timeouts.
   */
  static async importBackupJson(userId: string, rawJson: any): Promise<ImportSummary> {
    const summary: ImportSummary = {
      imported: 0,
      skipped: 0,
      duplicates: 0,
      invalid: 0,
      dateHeadersFound: 0,
      topicsCreated: [],
      totalInFile: 0,
      failed: 0,
      errors: [],
    };

    if (!rawJson) {
      throw new Error("Invalid backup format: empty payload received.");
    }

    // Normalize input format: support { folders: [...] }, { questions: [...] }, or flat array
    let normalizedFolders: Array<{ folderName: string; questionsList: any[] }> = [];

    if (Array.isArray(rawJson.folders)) {
      normalizedFolders = rawJson.folders.map((f: any) => ({
        folderName: (f.name || f.folderName || "General").trim(),
        questionsList: Array.isArray(f.questions) ? f.questions : [],
      }));
    } else if (Array.isArray(rawJson.questions)) {
      normalizedFolders = [
        {
          folderName: "Imported Questions",
          questionsList: rawJson.questions,
        },
      ];
    } else if (Array.isArray(rawJson)) {
      if (rawJson.length > 0 && Array.isArray(rawJson[0]?.questions)) {
        normalizedFolders = rawJson.map((f: any) => ({
          folderName: (f.name || f.folderName || "General").trim(),
          questionsList: Array.isArray(f.questions) ? f.questions : [],
        }));
      } else {
        normalizedFolders = [
          {
            folderName: "Imported Questions",
            questionsList: rawJson,
          },
        ];
      }
    } else {
      throw new Error("Invalid backup format: expected 'folders' or 'questions' array.");
    }

    // Count total questions across all folders
    summary.totalInFile = normalizedFolders.reduce((acc, f) => acc + f.questionsList.length, 0);

    const [questionsCol, topicsCol, categoriesCol, progressCol] = await Promise.all([
      getQuestionsCol(),
      getTopicsCol(),
      getCategoriesCol(),
      getQuestionProgressCol(),
    ]);

    const now = new Date();
    const topicCache = new Map<string, string>(); // topicName -> topicId
    const categoryCache = new Map<string, string>(); // categoryName -> categoryId

    // Helper to batch insert questions and progress records
    const BATCH_SIZE = 250;
    let questionBatch: any[] = [];

    const flushBatch = async () => {
      if (questionBatch.length === 0) return;
      const currentBatch = [...questionBatch];
      questionBatch = [];

      try {
        const res = await questionsCol.insertMany(currentBatch, { ordered: false });
        const insertedIds = res.insertedIds;
        const insertedKeys = Object.keys(insertedIds);

        // Build progress records for all successfully inserted questions
        const progressDocs: any[] = [];
        for (const key of insertedKeys) {
          const qId = insertedIds[parseInt(key)]?.toString();
          if (qId) {
            progressDocs.push({
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
          }
        }

        if (progressDocs.length > 0) {
          await progressCol.insertMany(progressDocs, { ordered: false });
        }

        summary.imported += insertedKeys.length;
      } catch (batchErr: any) {
        // Even if some documents fail in an unordered insert, MongoDB inserts the rest
        const count = batchErr.result?.insertedCount || batchErr.insertedDocs?.length || 0;
        summary.imported += count;
        summary.skipped += (currentBatch.length - count);
        if (batchErr.message) {
          summary.errors?.push(batchErr.message);
        }
      }
    };

    for (const folder of normalizedFolders) {
      const folderName = folder.folderName;
      const questionsList = folder.questionsList;

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

      // Resolve or get cached topicId
      let topicId: string | null = null;
      if (topicCache.has(topicName)) {
        topicId = topicCache.get(topicName)!;
      } else {
        const slug = topicName.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "topic";
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
        topicId = topic?._id?.toString() || null;
        if (topicId) {
          topicCache.set(topicName, topicId);
        }
        if (!summary.topicsCreated.includes(topicName)) {
          summary.topicsCreated.push(topicName);
        }
      }

      // Resolve or get cached categoryId
      let categoryId: string | null = null;
      if (topicName !== folderName) {
        const cleanCatName = folderName.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
        if (categoryCache.has(cleanCatName)) {
          categoryId = categoryCache.get(cleanCatName)!;
        } else {
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
          if (categoryId) {
            categoryCache.set(cleanCatName, categoryId);
          }
        }
      }

      let currentSectionDate: Date | null = null;

      for (const item of questionsList) {
        const qText = (item.q || item.question || item.questionText || "").trim();
        const rawOpts = item.opts || item.options || [];

        // Check if item is a section header or divider (0 options)
        if (!rawOpts || rawOpts.length === 0) {
          const parsedDate = this.extractDateFromHeader(qText);
          if (parsedDate) {
            currentSectionDate = parsedDate;
            summary.dateHeadersFound++;
          } else {
            summary.skipped++;
          }
          continue;
        }

        // Validate question text and option count
        if (!qText || rawOpts.length < 2) {
          summary.invalid++;
          continue;
        }

        // Determine correct answer index with safe bounds checking
        let ansIndex = 0;
        if (typeof item.ans === "number") {
          ansIndex = item.ans;
        } else if (typeof item.correctOptionIndex === "number") {
          ansIndex = item.correctOptionIndex;
        } else if (typeof item.answer === "number") {
          ansIndex = item.answer;
        }

        if (ansIndex < 0 || ansIndex >= rawOpts.length) {
          ansIndex = 0;
        }

        const options = rawOpts.map((opt: any, idx: number) => {
          const text = typeof opt === "string" ? opt : (opt?.text || opt?.optionText || String(opt || ""));
          const isCorrect = typeof opt === "object" && opt !== null && "isCorrect" in opt
            ? Boolean(opt.isCorrect)
            : idx === ansIndex;
          return {
            id: `opt_${idx + 1}`,
            optionText: text.trim(),
            optionOrder: idx,
            isCorrect,
          };
        });

        // Ensure at least one option is marked correct
        if (!options.some((o: any) => o.isCorrect) && options.length > 0) {
          options[0].isCorrect = true;
        }

        const isStarred = Boolean(item.starred || item.isFavorite) || isImportantFolder;

        // Resolve question date
        let qDate = currentSectionDate;
        if (!qDate && item.questionDate) {
          const parsed = new Date(item.questionDate);
          if (!isNaN(parsed.getTime())) qDate = parsed;
        }
        if (!qDate) {
          qDate = new Date();
        }

        questionBatch.push({
          userId,
          questionText: qText,
          explanation: item.explanation ? String(item.explanation).trim() : null,
          difficulty: Difficulty.MEDIUM,
          questionDate: qDate,
          source: folderName,
          isFavorite: isStarred,
          isArchived: false,
          topicId,
          categoryId,
          tagIds: [],
          options,
          createdAt: now,
          updatedAt: now,
        });

        // Flush batch when size limit reached
        if (questionBatch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      }
    }

    // Flush any remaining questions
    await flushBatch();

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
