import { z } from "zod";
import { AIGeneratedResponseSchema } from "@/lib/validation/schemas";
import {
  AIGenerationOptions,
  ConnectionTestResult,
  AIProvider as IAIProvider,
  AIProviderType,
} from "@/typings";

export type AIGeneratedQuestion = z.infer<typeof AIGeneratedResponseSchema>["questions"][number];

export type { AIGenerationOptions, ConnectionTestResult };

export interface AIProvider extends Omit<IAIProvider, "generateQuestions"> {
  readonly id: AIProviderType | "GEMINI" | "OPENAI" | "ANTHROPIC";
  testConnection(apiKey: string): Promise<ConnectionTestResult>;
  generateQuestions(
    apiKey: string,
    model: string,
    options: AIGenerationOptions
  ): Promise<AIGeneratedQuestion[]>;
}
