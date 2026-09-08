import { AIProvider, AIGenerationOptions, ConnectionTestResult, AIGeneratedQuestion } from "./ai-provider.interface";
import { AIGeneratedResponseSchema } from "@/lib/validation/schemas";

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
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));

      return {
        success: true,
        message: "Successfully connected to Google Gemini API!",
        models: models.length ? models : ["gemini-2.5-flash", "gemini-1.5-pro"],
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
    const activeModel = model || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are a professional educational assessment creator and exam question author.
Generate exactly ${options.count} high-quality multiple choice questions (MCQs) based on the user's instructions.
Difficulty level: ${options.difficulty || "MEDIUM"}.
Topic: ${options.topic || "General"}.
Category: ${options.category || "General"}.

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
      "category": "${options.category || "General"}",
      "difficulty": "${options.difficulty || "MEDIUM"}",
      "tags": ["tag1", "tag2"],
      "relatedQuestions": ["Suggestion 1", "Suggestion 2"]
    }
  ]
}`;

    const userPrompt = options.researchEnabled && options.contextData
      ? `Research Context:\n${options.contextData}\n\nTask: ${options.prompt}`
      : options.prompt;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini API returned error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsedJson = JSON.parse(rawText);
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
