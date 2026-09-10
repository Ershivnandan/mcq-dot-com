import { AIProvider, AIGenerationOptions, ConnectionTestResult, AIGeneratedQuestion } from "./ai-provider.interface";
import { AIGeneratedResponseSchema } from "@/lib/validation/schemas";

export class OpenAIProvider implements AIProvider {
  readonly id = "OPENAI" as const;

  async testConnection(apiKey: string): Promise<ConnectionTestResult> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return {
          success: false,
          message: err?.error?.message || `HTTP ${response.status}: Failed to authenticate with OpenAI.`,
        };
      }

      const data = await response.json();
      const models = (data.data || [])
        .filter((m: any) => m.id.includes("gpt"))
        .map((m: any) => m.id);

      return {
        success: true,
        message: "Successfully connected to OpenAI API!",
        models: models.length ? models : ["gpt-4o", "gpt-4o-mini"],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to reach OpenAI API.",
      };
    }
  }

  async generateQuestions(
    apiKey: string,
    model: string,
    options: AIGenerationOptions
  ): Promise<AIGeneratedQuestion[]> {
    const activeModel = model || "gpt-4o-mini";

    const optionCount = options.optionCount || 4;
    const sampleOptions = Array.from(
      { length: optionCount },
      (_, i) => `"Option ${String.fromCharCode(65 + i)}"`
    ).join(", ");

    const systemPrompt = `You are a professional educational assessment creator and exam question author.
Generate exactly ${options.count} high-quality multiple choice questions (MCQs) in valid JSON format.
Difficulty: ${options.difficulty || "MEDIUM"}.
Topic: ${options.topic || "General"}.
Category: ${options.category || "General"}.

IMPORTANT RULES:
1. Each question must have EXACTLY ${optionCount} distinct, realistic options.
2. Only ONE option must be correct.
3. Provide a clear, detailed explanation.

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "question": "Question string",
      "options": [${sampleOptions}],
      "correctOptionIndex": 0,
      "explanation": "Detailed explanation string",
      "topic": "${options.topic || "General"}",
      "category": "${options.category || "General"}",
      "difficulty": "${options.difficulty || "MEDIUM"}",
      "tags": ["tag1", "tag2"],
      "relatedQuestions": ["Suggestion 1"]
    }
  ]
}`;

    const userPrompt = options.researchEnabled && options.contextData
      ? `Research Context:\n${options.contextData}\n\nTask: ${options.prompt}`
      : options.prompt;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: activeModel,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI API returned error ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("OpenAI returned an empty response.");

    const parsed = JSON.parse(rawContent);
    const validated = AIGeneratedResponseSchema.safeParse(parsed);

    if (!validated.success) {
      if (Array.isArray(parsed)) {
        const fallback = AIGeneratedResponseSchema.safeParse({ questions: parsed });
        if (fallback.success) return fallback.data.questions;
      }
      throw new Error(`OpenAI response failed schema validation: ${validated.error.message}`);
    }

    return validated.data.questions;
  }
}
