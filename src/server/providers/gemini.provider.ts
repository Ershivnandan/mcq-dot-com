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
        models: models.length ? models : ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"],
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
    // Automatically map deprecated models (gemini-2.5, gemini-2.0, gemini-1.5, etc.) to gemini-3.5-flash
    const activeModel =
      requestedModel.startsWith("gemini-2.") || requestedModel.startsWith("gemini-1.")
        ? "gemini-3.5-flash"
        : requestedModel;

    const optionCount = options.optionCount || 4;
    const sampleOptions = Array.from(
      { length: optionCount },
      (_, i) => `"Option ${String.fromCharCode(65 + i)}"`
    ).join(", ");

    const systemPrompt = `You are a professional educational assessment creator and exam question author.
Generate exactly ${options.count} high-quality multiple choice questions (MCQs) based on the user's instructions.
Difficulty level: ${options.difficulty || "MEDIUM"}.
Topic: ${options.topic || "General"}.

CRITICAL RULES:
1. EXACT QUESTION FIDELITY (HIGHEST PRIORITY):
   - If the user prompt asks a specific question, poses a problem statement, or inquires about a concrete fact or concept (e.g., "What is X?", "Which protocol...", "Explain Y", etc.), you MUST format THAT EXACT QUESTION as Question #1 (the first MCQ in the "questions" array).
   - Question #1 must directly present that exact question, with accurate correct answer, ${optionCount - 1} plausible distractors, and a thorough explanation answering it.
   - The remaining questions (Questions #2 through #${options.count}) should be closely related, relevant follow-up questions exploring that topic.
   - Only if the prompt is purely a broad topic without a specific question should all questions be drawn generally from the topic.
2. Each question must have EXACTLY ${optionCount} distinct, realistic options.
3. Only ONE option must be correct (indicated by zero-based correctOptionIndex).
4. Provide an in-depth, clear explanation why the correct answer is right and why others are wrong.
5. Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": [${sampleOptions}],
      "correctOptionIndex": 0,
      "explanation": "Detailed explanation here",
      "topic": "${options.topic || "General"}",
      "difficulty": "${options.difficulty || "MEDIUM"}",
      "tags": ["tag1", "tag2"],
      "relatedQuestions": ["Suggestion 1", "Suggestion 2"]
    }
  ]
}`;

    let userPrompt = options.researchEnabled && options.contextData
      ? `VERIFIED RESEARCH CONTEXT:\n${options.contextData}\n\nUSER PROMPT / TASK:\n${options.prompt}`
      : `USER PROMPT / TASK:\n${options.prompt}`;

    userPrompt += `\n\nREMINDER: If a specific question was asked in the prompt, generate that exact question as Question #1, followed by related questions.`;

    const ai = new GoogleGenAI({ apiKey });
    let rawText: string | undefined;

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
    } catch (genError: any) {
      throw new Error(
        genError?.message || "Failed to generate questions with Google Gemini API."
      );
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
