import { GoogleGenAI } from "@google/genai";
import { AIProvider, AIGenerationOptions, ConnectionTestResult, AIGeneratedQuestion } from "./ai-provider.interface";
import { AIGeneratedResponseSchema } from "@/lib/validation/schemas";
import { DEFAULT_GEMINI_MODEL } from "@/lib/constants/ai-models";

export class GeminiProvider implements AIProvider {
  readonly id = "GEMINI" as const;

  async testConnection(apiKey: string): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { method: "GET" }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return {
          success: false,
          message: err?.error?.message || `HTTP ${response.status}: Failed to authenticate with Google Gemini.`,
        };
      }

      const data = await response.json();
      const models = (data.models || [])
        .map((m: any) => m.name.replace("models/", ""))
        .filter((name: string) => !name.startsWith("embedding") && !name.startsWith("imagen") && !name.startsWith("aqa"));

      return {
        success: true,
        message: "Successfully connected to Google Gemini API!",
        models: models.length ? models : ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to reach Google Gemini API.",
      };
    }
  }

  async generateQuestions(
    apiKey: string,
    model: string,
    options: AIGenerationOptions
  ): Promise<AIGeneratedQuestion[]> {
    const requestedModel = model || DEFAULT_GEMINI_MODEL;
    // Automatically map deprecated models (gemini-2.5, gemini-2.0, gemini-1.5, etc.) to gemini-3.6-flash
    const activeModel =
      requestedModel.startsWith("gemini-2.") || requestedModel.startsWith("gemini-1.")
        ? "gemini-3.6-flash"
        : requestedModel;

    const systemPrompt = `You are a professional educational assessment creator and exam question author.
Generate exactly ${options.count} high-quality multiple choice questions (MCQs) based on the user's instructions.
Difficulty level: ${options.difficulty || "MEDIUM"}.
Topic: ${options.topic || "General"}.

IMPORTANT RULES:
1. Each question must have between 3 to 5 realistic options.
2. Only ONE option must be correct.
3. Provide an in-depth, clear explanation why the correct answer is right and why others are wrong.
4. Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Detailed explanation here",
      "topic": "${options.topic || "General"}",
      "difficulty": "${options.difficulty || "MEDIUM"}",
      "tags": ["tag1", "tag2"],
      "relatedQuestions": ["Suggestion 1", "Suggestion 2"]
    }
  ]
}`;

    const userPrompt = options.researchEnabled && options.contextData
      ? `Research Context:\n${options.contextData}\n\nTask: ${options.prompt}`
      : options.prompt;

    const ai = new GoogleGenAI({ apiKey });
    let rawText: string | undefined;

    // First attempt: Interactions API (Recommended by Google Gemini)
    try {
      const interaction = await ai.interactions.create({
        model: activeModel,
        input: `${systemPrompt}\n\nUser Request: ${userPrompt}`,
        response_mime_type: "application/json",
        store: false,
      });

      rawText = interaction.output_text;

      // If output_text is empty, check steps
      if (!rawText && interaction.steps && interaction.steps.length > 0) {
        for (const step of interaction.steps) {
          if ((step as any).output_text) {
            rawText = (step as any).output_text;
            break;
          }
        }
      }
    } catch (interactionsError: any) {
      console.warn("Interactions API attempt failed, falling back to generateContent:", interactionsError?.message);

      // Fallback: models.generateContent
      try {
        const response = await ai.models.generateContent({
          model: activeModel,
          contents: `${systemPrompt}\n\nUser Request: ${userPrompt}`,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });
        rawText = response.text;
      } catch (genContentError: any) {
        throw new Error(
          genContentError?.message ||
          interactionsError?.message ||
          "Failed to generate questions with Google Gemini API."
        );
      }
    }

    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    // Clean any markdown backticks if returned
    const cleanText = rawText.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(cleanText);
    } catch (err: any) {
      throw new Error(`Failed to parse AI response as JSON: ${err.message}. Content: ${cleanText.slice(0, 150)}...`);
    }

    const validated = AIGeneratedResponseSchema.safeParse(parsedJson);

    if (!validated.success) {
      // Fallback: If returned an array directly
      if (Array.isArray(parsedJson)) {
        const fallback = AIGeneratedResponseSchema.safeParse({ questions: parsedJson });
        if (fallback.success) return fallback.data.questions;
      }
      throw new Error(`AI generated invalid response format: ${validated.error.message}`);
    }

    return validated.data.questions;
  }
}
