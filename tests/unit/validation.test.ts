import { describe, it, expect } from "vitest";
import {
  QuestionInputSchema,
  SignUpSchema,
  CreateQuizSchema,
  AIGeneratedResponseSchema,
  AIGenerateRequestSchema,
  QuestionQuerySchema,
} from "@/lib/validation/schemas";

describe("Zod Validation Schemas", () => {
  it("validates valid question input with options and correct answer", () => {
    const valid = {
      questionText: "What is the capital of France?",
      difficulty: "EASY",
      options: [
        { optionText: "Paris", isCorrect: true, optionOrder: 0 },
        { optionText: "Berlin", isCorrect: false, optionOrder: 1 },
      ],
    };
    const result = QuestionInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("fails if question has fewer than 2 options", () => {
    const invalid = {
      questionText: "Too few options?",
      options: [{ optionText: "Only one", isCorrect: true, optionOrder: 0 }],
    };
    const result = QuestionInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("fails if question has no correct option marked", () => {
    const invalid = {
      questionText: "No answer marked?",
      options: [
        { optionText: "A", isCorrect: false, optionOrder: 0 },
        { optionText: "B", isCorrect: false, optionOrder: 1 },
      ],
    };
    const result = QuestionInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("validates signup schema requirements", () => {
    const badEmail = SignUpSchema.safeParse({ email: "invalid", password: "123456" });
    expect(badEmail.success).toBe(false);

    const shortPass = SignUpSchema.safeParse({ email: "user@test.com", password: "123" });
    expect(shortPass.success).toBe(false);

    const good = SignUpSchema.safeParse({ email: "user@test.com", password: "password123" });
    expect(good.success).toBe(true);
  });

  it("validates AI generated response schema", () => {
    const aiOutput = {
      questions: [
        {
          question: "Explain closures in JavaScript.",
          options: ["Function with lexical scope", "Object", "Array", "Variable"],
          correctOptionIndex: 0,
          explanation: "Closures preserve lexical environment.",
          topic: "JavaScript",
          difficulty: "MEDIUM",
          tags: ["js", "es6"],
          relatedQuestions: ["What is currying?"],
        },
      ],
    };
    const result = AIGeneratedResponseSchema.safeParse(aiOutput);
    expect(result.success).toBe(true);
  });

  it("validates question query schema with date range and ascending sort", () => {
    const query = {
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      sortBy: "questionDate",
      sortOrder: "asc",
      page: "1",
      limit: "20",
    };
    const result = QuestionQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dateFrom).toBe("2026-06-01");
      expect(result.data.dateTo).toBe("2026-06-30");
      expect(result.data.sortBy).toBe("questionDate");
      expect(result.data.sortOrder).toBe("asc");
    }
  });

  it("handles isFavorite query param correctly (true vs undefined/false)", () => {
    // When isFavorite="true", should be parsed as boolean true
    const starredQuery = QuestionQuerySchema.parse({ isFavorite: "true" });
    expect(starredQuery.isFavorite).toBe(true);

    // When isFavorite is omitted, should be undefined
    const normalQuery = QuestionQuerySchema.parse({});
    expect(normalQuery.isFavorite).toBeUndefined();

    // When isFavorite="false", should be boolean false
    const unstarredQuery = QuestionQuerySchema.parse({ isFavorite: "false" });
    expect(unstarredQuery.isFavorite).toBe(false);
  });

  it("validates AIGenerateRequestSchema with topicId and questionDate", () => {
    const aiReq = {
      prompt: "Generate 5 questions on Distributed Transactions",
      count: 5,
      difficulty: "HARD",
      topicId: "topic_12345",
      topic: "System Design",
      questionDate: "2026-09-09",
    };
    const result = AIGenerateRequestSchema.safeParse(aiReq);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topicId).toBe("topic_12345");
      expect(result.data.questionDate).toBe("2026-09-09");
      expect(result.data.topic).toBe("System Design");
    }
  });
});
