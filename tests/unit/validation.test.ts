import { describe, it, expect } from "vitest";
import {
  QuestionInputSchema,
  SignUpSchema,
  CreateQuizSchema,
  AIGeneratedResponseSchema,
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
});
