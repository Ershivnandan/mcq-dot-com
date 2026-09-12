import { AIProvider, AIGenerationOptions, ConnectionTestResult, AIGeneratedQuestion } from "./ai-provider.interface";
import { AIGeneratedResponseSchema } from "@/lib/validation/schemas";

export class AnthropicProvider implements AIProvider {
  readonly id = "ANTHROPIC" as const;

  async testConnection(apiKey: string): Promise<ConnectionTestResult> {
    try {
      // Send a minimal message to test the key
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return {
          success: false,
          message: err?.error?.message || `HTTP ${response.status}: Failed to authenticate with Anthropic.`,
        };
      }

      return {
        success: true,
        message: "Successfully connected to Anthropic Claude API!",
        models: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to reach Anthropic API.",
      };
    }
  }

  async generateQuestions(
    apiKey: string,
    model: string,
    options: AIGenerationOptions
  ): Promise<AIGeneratedQuestion[]> {
    const activeModel = model || "claude-3-5-haiku-latest";

    const optionCount = options.optionCount || 4;
    const sampleOptions = Array.from(
      { length: optionCount },
      (_, i) => `"Option ${String.fromCharCode(65 + i)}"`
    ).join(", ");

    const systemPrompt = `You are an expert exam question creator.
Generate exactly ${options.count} high-quality MCQs as JSON.
Difficulty: ${options.difficulty || "MEDIUM"}.
Topic: ${options.topic || "General"}.
Category: ${options.category || "General"}.

CRITICAL RULES:
1. EXACT QUESTION FIDELITY (HIGHEST PRIORITY):
   - If the user prompt asks a specific question, poses a problem statement, or inquires about a concrete fact or concept (e.g., "What is X?", "Which protocol...", "Explain Y", etc.), you MUST format THAT EXACT QUESTION as Question #1 (the first MCQ in the "questions" array).
   - Question #1 must directly present that exact question, with accurate correct answer, ${optionCount - 1} plausible distractors, and a thorough explanation answering it.
   - The remaining questions (Questions #2 through #${options.count}) should be closely related, relevant follow-up questions exploring that topic.
   - Only if the prompt is purely a broad topic without a specific question should all questions be drawn generally from the topic.
2. Each question must have EXACTLY ${optionCount} distinct, realistic options.
3. Only ONE option must be correct (indicated by zero-based correctOptionIndex).
4. Provide a clear, detailed explanation.

Return ONLY a JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text",
      "options": [${sampleOptions}],
      "correctOptionIndex": 0,
      "explanation": "Detailed explanation",
      "topic": "${options.topic || "General"}",
      "category": "${options.category || "General"}",
      "difficulty": "${options.difficulty || "MEDIUM"}",
      "tags": ["tag1", "tag2"],
      "relatedQuestions": ["Suggestion 1"]
    }
  ]
}
Output nothing else, just the JSON.`;

    let userPrompt = options.researchEnabled && options.contextData
      ? `VERIFIED RESEARCH CONTEXT:\n${options.contextData}\n\nUSER PROMPT / TASK:\n${options.prompt}`
      : `USER PROMPT / TASK:\n${options.prompt}`;

    userPrompt += `\n\nREMINDER: If a specific question was asked in the prompt, generate that exact question as Question #1, followed by related questions.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: activeModel,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic API returned error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text;
    if (!rawText) throw new Error("Anthropic returned an empty response.");

    // Extract JSON block if surrounded by markdown fences
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from Anthropic response.");

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = AIGeneratedResponseSchema.safeParse(parsed);

    if (!validated.success) {
      throw new Error(`Anthropic output failed validation: ${validated.error.message}`);
    }

    return validated.data.questions;
  }
}
