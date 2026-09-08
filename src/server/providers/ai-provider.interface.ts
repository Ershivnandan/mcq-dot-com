import { z } from "zod";
import { AIGeneratedResponseSchema, DifficultyEnum } from "@/lib/validation/schemas";

export type AIGeneratedQuestion = z.infer<typeof AIGeneratedResponseSchema>["questions"][number];

export interface AIGenerationOptions {
  prompt: string;
  count: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  topic?: string;
  category?: string;
  researchEnabled?: boolean;
  contextData?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  models?: string[];
}

export interface AIProvider {
  readonly id: "GEMINI" | "OPENAI" | "ANTHROPIC";
  testConnection(apiKey: string): Promise<ConnectionTestResult>;
  generateQuestions(
    apiKey: string,
    model: string,
    options: AIGenerationOptions
  ): Promise<AIGeneratedQuestion[]>;
}
