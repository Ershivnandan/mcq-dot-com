import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImportExportService } from "@/server/services/import-export.service";
import * as db from "@/server/db";

describe("ImportExportService - Bulk Import", () => {
  let mockQuestionsCol: any;
  let mockTopicsCol: any;
  let mockCategoriesCol: any;
  let mockProgressCol: any;

  beforeEach(() => {
    mockQuestionsCol = {
      findOne: vi.fn().mockResolvedValue(null),
      insertMany: vi.fn().mockImplementation((docs) => {
        const insertedIds: Record<number, string> = {};
        docs.forEach((_: any, idx: number) => {
          insertedIds[idx] = `mock_qid_${idx}`;
        });
        return Promise.resolve({ insertedIds, insertedCount: docs.length });
      }),
    };

    mockTopicsCol = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ _id: "topic_123", name: "Current Affairs" }),
    };

    mockCategoriesCol = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ _id: "cat_123", name: "General" }),
    };

    mockProgressCol = {
      insertMany: vi.fn().mockResolvedValue({ acknowledged: true }),
    };

    vi.spyOn(db, "getQuestionsCol").mockResolvedValue(mockQuestionsCol as any);
    vi.spyOn(db, "getTopicsCol").mockResolvedValue(mockTopicsCol as any);
    vi.spyOn(db, "getCategoriesCol").mockResolvedValue(mockCategoriesCol as any);
    vi.spyOn(db, "getQuestionProgressCol").mockResolvedValue(mockProgressCol as any);
  });

  it("handles folder-based backups with thousands of questions in high-performance batches", async () => {
    // Generate 1,200 mock questions across 2 folders
    const questionsListA = Array.from({ length: 700 }, (_, i) => ({
      q: `Sample Question A-${i}?`,
      opts: ["Alpha", "Beta", "Gamma", "Delta"],
      ans: i % 4,
      starred: i % 5 === 0,
    }));

    const questionsListB = Array.from({ length: 500 }, (_, i) => ({
      q: `Sample Question B-${i}?`,
      opts: ["Option 1", "Option 2"],
      ans: i % 2,
    }));

    const mockBackup = {
      folders: [
        { name: "Current Affairs", questions: questionsListA },
        { name: "Static GK", questions: questionsListB },
      ],
    };

    const summary = await ImportExportService.importBackupJson("user_1", mockBackup);

    expect(summary.imported).toBe(1200);
    expect(summary.totalInFile).toBe(1200);
    expect(summary.invalid).toBe(0);
    expect(summary.skipped).toBe(0);

    // Verify batching: 1,200 questions in batches of 250 = 5 batches
    expect(mockQuestionsCol.insertMany).toHaveBeenCalledTimes(5);
    expect(mockProgressCol.insertMany).toHaveBeenCalledTimes(5);
  });

  it("handles date section dividers and extracts dates without crashing", async () => {
    const mockBackup = {
      folders: [
        {
          name: "May 📜",
          questions: [
            { q: "📋 1 May 2026 📋", opts: [], ans: 0 },
            { q: "What happened on May 1?", opts: ["Event A", "Event B"], ans: 0 },
            { q: "Another question?", opts: ["Yes", "No"], ans: 1 },
          ],
        },
      ],
    };

    const summary = await ImportExportService.importBackupJson("user_1", mockBackup);

    expect(summary.imported).toBe(2);
    expect(summary.dateHeadersFound).toBe(1);
    expect(summary.totalInFile).toBe(3);
    expect(mockQuestionsCol.insertMany).toHaveBeenCalledTimes(1);
  });

  it("safely sanitizes out-of-bounds answer indices and empty questions", async () => {
    const mockBackup = {
      folders: [
        {
          name: "Edge Cases",
          questions: [
            // Out of bounds ans (index 99 for 2 options) -> falls back to 0
            { q: "Valid Q with out of bounds answer?", opts: ["A", "B"], ans: 99 },
            // Empty question text -> marked invalid
            { q: "   ", opts: ["A", "B"], ans: 0 },
            // Less than 2 options -> marked invalid
            { q: "Only 1 option?", opts: ["Only A"], ans: 0 },
          ],
        },
      ],
    };

    const summary = await ImportExportService.importBackupJson("user_1", mockBackup);

    expect(summary.imported).toBe(1);
    expect(summary.invalid).toBe(2);
    expect(mockQuestionsCol.insertMany).toHaveBeenCalledTimes(1);
  });

  it("supports flat-array export format seamlessly", async () => {
    const mockExportFormat = {
      exportedAt: new Date().toISOString(),
      count: 2,
      questions: [
        { question: "Exported Question 1?", options: [{ text: "O1", isCorrect: true }, { text: "O2", isCorrect: false }] },
        { question: "Exported Question 2?", options: [{ text: "O1", isCorrect: false }, { text: "O2", isCorrect: true }] },
      ],
    };

    const summary = await ImportExportService.importBackupJson("user_1", mockExportFormat);

    expect(summary.imported).toBe(2);
    expect(summary.totalInFile).toBe(2);
    expect(mockQuestionsCol.insertMany).toHaveBeenCalledTimes(1);
  });

  it("strictly preserves the original sequence order of questions from the JSON file", async () => {
    mockQuestionsCol.findOne.mockResolvedValueOnce({ orderIndex: 42 });

    const mockBackup = {
      folders: [
        {
          name: "Section 1",
          questions: [
            { q: "First Question?", opts: ["A", "B"], ans: 0 },
            { q: "Second Question?", opts: ["A", "B"], ans: 1 },
            { q: "Third Question?", opts: ["A", "B"], ans: 0 },
          ],
        },
      ],
    };

    const summary = await ImportExportService.importBackupJson("user_1", mockBackup);

    expect(summary.imported).toBe(3);
    expect(mockQuestionsCol.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ questionText: "First Question?", orderIndex: 43 }),
        expect.objectContaining({ questionText: "Second Question?", orderIndex: 44 }),
        expect.objectContaining({ questionText: "Third Question?", orderIndex: 45 }),
      ]),
      { ordered: true }
    );
  });
});
