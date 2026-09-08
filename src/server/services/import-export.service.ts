import { prisma } from "@/server/db";

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

    // Get all existing question texts for user to prevent duplicates
    const existingQuestions = await prisma.question.findMany({
      where: { userId },
      select: { questionText: true },
    });
    const existingSet = new Set(existingQuestions.map((q) => q.questionText.trim().toLowerCase()));

    // Create or find Important collection
    let importantCollection = await prisma.collection.findFirst({
      where: { userId, name: "Important" },
    });
    if (!importantCollection) {
      importantCollection = await prisma.collection.create({
        data: {
          userId,
          name: "Important",
          description: "Starred and important questions from backup",
          color: "#f59e0b",
        },
      });
    }

    for (const folder of rawJson.folders) {
      const folderName = (folder.name || "").trim();
      const questionsList = folder.questions || [];

      if (!folderName || questionsList.length === 0) {
        summary.skipped += questionsList.length;
        continue;
      }

      // Skip the "Important" folder if it only contains duplicates of starred items
      const isImportantFolder = folderName.toLowerCase() === "important";

      // Determine topic/category
      let topicName = folderName;
      if (["May 📜", "June📜", "July 📜", "August", "September"].includes(folderName)) {
        topicName = "Current Affairs";
      }

      const topic = await prisma.topic.upsert({
        where: { userId_name: { userId, name: topicName } },
        create: {
          userId,
          name: topicName,
          slug: topicName.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "topic",
        },
        update: {},
      });

      if (!summary.topicsCreated.includes(topicName)) {
        summary.topicsCreated.push(topicName);
      }

      let categoryId: string | null = null;
      if (topicName !== folderName) {
        const cleanCatName = folderName.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
        const category = await prisma.category.upsert({
          where: { userId_name: { userId, name: cleanCatName } },
          create: {
            userId,
            topicId: topic.id,
            name: cleanCatName,
            slug: cleanCatName.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "category",
          },
          update: {},
        });
        categoryId = category.id;
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

        const normalizedQ = qText.toLowerCase();

        // If duplicate
        if (existingSet.has(normalizedQ)) {
          summary.duplicates++;
          // If in important folder or item is starred, ensure favorite flag and collection
          if (isImportantFolder || item.starred) {
            await prisma.question.updateMany({
              where: { userId, questionText: qText },
              data: { isFavorite: true },
            });
          }
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
        const collectionIds = isStarred && importantCollection ? [importantCollection.id] : [];

        await prisma.question.create({
          data: {
            userId,
            questionText: qText,
            explanation: item.explanation || null,
            difficulty: "MEDIUM",
            questionDate: currentSectionDate || new Date(),
            source: folderName,
            isFavorite: isStarred,
            isArchived: false,
            topicId: topic.id,
            categoryId,
            collectionIds,
            tagIds: [],
            options,
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
        });

        existingSet.add(normalizedQ);
        summary.imported++;
      }
    }

    return summary;
  }

  /**
   * Exports questions to a portable JSON backup.
   */
  static async exportQuestionsJson(userId: string, filter?: { collectionId?: string; topicId?: string }) {
    const where: any = { userId };
    if (filter?.collectionId) where.collectionIds = { has: filter.collectionId };
    if (filter?.topicId) where.topicId = filter.topicId;

    const questions = await prisma.question.findMany({
      where,
      include: {
        topic: true,
        category: true,
        tags: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      exportedAt: new Date().toISOString(),
      count: questions.length,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.questionText,
        explanation: q.explanation,
        difficulty: q.difficulty,
        questionDate: q.questionDate,
        topic: q.topic?.name || null,
        category: q.category?.name || null,
        tags: q.tags.map((t) => t.name),
        isFavorite: q.isFavorite,
        options: q.options.map((o) => ({
          text: o.optionText,
          isCorrect: o.isCorrect,
        })),
      })),
    };
  }
}
