import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserResetService } from "@/server/services/user-reset.service";
import * as db from "@/server/db";

describe("UserResetService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("wipeUserQuestions hard deletes questions, progress, and drafts while clearing quiz references", async () => {
    const mockDeleteMany = vi.fn().mockResolvedValue({ deletedCount: 15 });
    const mockUpdateMany = vi.fn().mockResolvedValue({ modifiedCount: 2 });

    vi.spyOn(db, "getQuestionsCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getQuestionProgressCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getAIDraftsCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getQuizzesCol").mockResolvedValue({ updateMany: mockUpdateMany } as any);

    const res = await UserResetService.wipeUserQuestions("user_test_123");

    expect(res.success).toBe(true);
    expect(res.questionsDeleted).toBe(15);
    expect(mockDeleteMany).toHaveBeenCalledTimes(3);
    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
  });

  it("resetUserData hard deletes all user study content while preserving account & sessions", async () => {
    const mockDeleteMany = vi.fn().mockResolvedValue({ deletedCount: 10 });

    vi.spyOn(db, "getQuestionsCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getQuestionProgressCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getAIDraftsCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getQuizzesCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getQuizAttemptsCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getTopicsCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getCategoriesCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getTagsCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);
    vi.spyOn(db, "getAIUsageLogsCol").mockResolvedValue({ deleteMany: mockDeleteMany } as any);

    const res = await UserResetService.resetUserData("user_test_123");

    expect(res.success).toBe(true);
    expect(res.questionsDeleted).toBe(10);
    expect(res.quizzesDeleted).toBe(10);
    expect(res.topicsDeleted).toBe(10);
    expect(mockDeleteMany).toHaveBeenCalledTimes(9);
  });
});
