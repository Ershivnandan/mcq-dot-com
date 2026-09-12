import { getDb, getQuestionsCol, getAIDraftsCol, toObjectId } from "@/server/db";
import { AIService } from "./ai.service";
import { decryptApiKey } from "@/server/encryption/crypto";
import { getAIProviderConfigsCol } from "@/server/db";
import { GoogleGenAI } from "@google/genai";
import { AIGeneratedQuestion } from "@/server/providers/ai-provider.interface";
import { AIGeneratedResponseSchema } from "@/lib/validation/schemas";

/**
 * Calculates cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class RAGService {
  /**
   * Generates a vector embedding for a given text using the user's configured AI provider.
   * Supports Google Gemini (text-embedding-004) and OpenAI (text-embedding-3-small).
   */
  static async generateEmbedding(userId: string, text: string): Promise<number[] | null> {
    try {
      const col = await getAIProviderConfigsCol();
      const configs = await col.find({ userId, isEnabled: true }).toArray();
      const activeConfig = configs.find((c) => c.isDefault) || configs[0];
      if (!activeConfig) return null;

      const rawApiKey = decryptApiKey({
        encryptedKey: activeConfig.encryptedKey,
        iv: activeConfig.iv,
        tag: activeConfig.tag,
      });

      if (activeConfig.provider === "GEMINI") {
        try {
          const ai = new GoogleGenAI({ apiKey: rawApiKey });
          const response = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: text.slice(0, 2048),
          });
          const resAny = response as any;
          if (Array.isArray(response.embeddings) && response.embeddings[0]?.values) {
            return response.embeddings[0].values;
          }
          if (resAny.embedding?.values) {
            return resAny.embedding.values;
          }
        } catch {
          // Fallback to REST endpoint
          const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${rawApiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: { parts: [{ text: text.slice(0, 2048) }] },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            return data?.embedding?.values || null;
          }
        }
      }

      if (activeConfig.provider === "OPENAI") {
        const res = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${rawApiKey}`,
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text.slice(0, 2048),
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.data?.[0]?.embedding || null;
      }

      return null;
    } catch (err) {
      console.warn("RAG: generateEmbedding non-fatal error:", err);
      return null;
    }
  }

  /**
   * Searches for similar questions in the user's question library using
   * MongoDB Atlas Vector Search ($vectorSearch) with graceful fallback
   * to semantic text search & cosine similarity.
   */
  static async searchSimilarQuestions(
    userId: string,
    queryText: string,
    limit = 4
  ): Promise<any[]> {
    const qCol = await getQuestionsCol();

    // 1. Try vector embedding
    const queryEmbedding = await this.generateEmbedding(userId, queryText);

    if (queryEmbedding && queryEmbedding.length > 0) {
      // Try MongoDB Atlas $vectorSearch first
      try {
        const pipeline = [
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: 40,
              limit,
              filter: { userId: { $eq: userId } },
            },
          },
          {
            $project: {
              questionText: 1,
              options: 1,
              explanation: 1,
              topic: 1,
              difficulty: 1,
              score: { $meta: "vectorSearchScore" },
            },
          },
        ];

        const results = await qCol.aggregate(pipeline).toArray();
        if (results && results.length > 0) {
          return results;
        }
      } catch (atlasErr) {
        // Expected if Atlas Vector Search index is not yet built or running on standard MongoDB
        // Fall back to in-memory cosine ranking over questions that have embeddings
        try {
          const withEmbeddings = await qCol
            .find({ userId, embedding: { $exists: true } })
            .limit(100)
            .toArray();

          if (withEmbeddings.length > 0) {
            const ranked = withEmbeddings
              .map((q: any) => ({
                ...q,
                sim: cosineSimilarity(queryEmbedding, q.embedding),
              }))
              .sort((a, b) => b.sim - a.sim)
              .slice(0, limit);

            if (ranked.length > 0 && ranked[0].sim > 0.4) {
              return ranked;
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    // Fallback: Text / Keyword semantic search across user questions
    try {
      const terms = queryText
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5);

      if (terms.length > 0) {
        const regexPattern = terms.join("|");
        const matched = await qCol
          .find({
            userId,
            $or: [
              { questionText: { $regex: regexPattern, $options: "i" } },
              { explanation: { $regex: regexPattern, $options: "i" } },
            ],
          })
          .limit(limit)
          .toArray();

        return matched;
      }
    } catch {
      // Ignore
    }

    return [];
  }

  /**
   * Builds RAG context string from similar questions in the user's question bank.
   */
  static async buildRAGContext(userId: string, prompt: string, topic?: string): Promise<string> {
    try {
      const similar = await this.searchSimilarQuestions(userId, `${prompt} ${topic || ""}`, 3);
      if (!similar || similar.length === 0) return "";

      const lines: string[] = [
        "=== RETRIEVED REFERENCE QUESTIONS FROM USER'S QUESTION BANK (RAG) ===",
      ];

      similar.forEach((q, idx) => {
        lines.push(`\n[Reference Question #${idx + 1}]`);
        lines.push(`Question: ${q.questionText}`);
        if (Array.isArray(q.options)) {
          lines.push(
            `Options: ${q.options
              .map((o: any) => `${o.optionText}${o.isCorrect ? " (CORRECT)" : ""}`)
              .join(" | ")}`
          );
        }
        if (q.explanation) {
          lines.push(`Explanation: ${q.explanation}`);
        }
      });

      lines.push("\n=== END REFERENCE QUESTIONS ===");
      lines.push(
        "Use the above questions as reference for style, domain facts, and formatting standard."
      );

      return lines.join("\n");
    } catch (err) {
      console.warn("RAG: buildRAGContext non-fatal error:", err);
      return "";
    }
  }

  /**
   * Refines or regenerates a draft question based on user feedback / critique.
   * e.g., "question 2 is not generated properly, the options are wrong" or "make it harder".
   */
  static async refineDraftQuestion(
    userId: string,
    params: {
      draftId: string;
      feedback: string;
      conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    }
  ) {
    const draftsCol = await getAIDraftsCol();
    const draft = await draftsCol.findOne({
      _id: toObjectId(params.draftId),
      userId,
    });

    if (!draft) {
      throw new Error("Draft question not found.");
    }

    // Get active provider config
    const configsCol = await getAIProviderConfigsCol();
    const config =
      (await configsCol.findOne({ userId, isDefault: true, isEnabled: true })) ||
      (await configsCol.findOne({ userId, isEnabled: true }));

    if (!config) {
      throw new Error("No active AI provider configured for refinement.");
    }

    const rawApiKey = decryptApiKey({
      encryptedKey: config.encryptedKey,
      iv: config.iv,
      tag: config.tag,
    });

    // RAG grounding context
    const ragContext = await this.buildRAGContext(
      userId,
      `${draft.questionText} ${params.feedback}`,
      draft.topic || undefined
    );

    const optionCount = Array.isArray(draft.optionsJson) ? draft.optionsJson.length : 4;
    const sampleOptions = Array.from(
      { length: optionCount },
      (_, i) => `"Option ${String.fromCharCode(65 + i)}"`
    ).join(", ");

    const refinementPrompt = `You are a master educational assessment editor and exam reviewer.
You are tasked with revising and perfecting a multiple-choice question according to user feedback.

ORIGINAL DRAFT QUESTION:
- Question: ${draft.questionText}
- Options:
${(draft.optionsJson || []).map((o: any, idx: number) => `  ${idx + 1}. ${o.optionText} ${o.isCorrect ? "[CORRECT]" : ""}`).join("\n")}
- Explanation: ${draft.explanation || "None provided"}
- Topic: ${draft.topic || "General"}
- Difficulty: ${draft.difficulty || "MEDIUM"}

USER CRITIQUE & CORRECTION REQUEST:
"${params.feedback}"

${ragContext ? `${ragContext}\n` : ""}

REFINEMENT INSTRUCTIONS:
1. Address 100% of the user's critique and feedback. If the user pointed out an error, ambiguity, or poor options, fix it with precision.
2. Produce an improved, factually rigorous MCQ with EXACTLY ${optionCount} options and ONLY ONE correct answer.
3. Provide a clear, step-by-step explanation.
4. Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "question": "Revised question text here",
      "options": [${sampleOptions}],
      "correctOptionIndex": 0,
      "explanation": "Revised detailed explanation here",
      "topic": "${draft.topic || "General"}",
      "difficulty": "${draft.difficulty || "MEDIUM"}",
      "tags": ["tag1", "tag2"],
      "relatedQuestions": []
    }
  ]
}`;

    // Call LLM using Gemini or OpenAI or Anthropic
    let parsedQuestion: AIGeneratedQuestion;

    if (config.provider === "GEMINI") {
      const ai = new GoogleGenAI({ apiKey: rawApiKey });
      const model = config.defaultModel || "gemini-3.5-flash";
      const response = await ai.models.generateContent({
        model: model.startsWith("gemini-2.") || model.startsWith("gemini-1.") ? "gemini-3.5-flash" : model,
        contents: refinementPrompt,
        config: { responseMimeType: "application/json", temperature: 0.5 },
      });
      const rawText = response.text || "";
      const clean = rawText.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
      const parsed = JSON.parse(clean);
      const validated = AIGeneratedResponseSchema.parse(parsed);
      parsedQuestion = validated.questions[0];
    } else {
      // Fallback: OpenAI / fetch
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rawApiKey}`,
        },
        body: JSON.stringify({
          model: config.defaultModel || "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a professional question editor. Return JSON only." },
            { role: "user", content: refinementPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
        }),
      });
      const data = await res.json();
      const clean = data.choices[0].message.content.trim();
      const parsed = JSON.parse(clean);
      const validated = AIGeneratedResponseSchema.parse(parsed);
      parsedQuestion = validated.questions[0];
    }

    // Update draft in database
    const now = new Date();
    const updatedOptions = parsedQuestion.options.map((opt, idx) => ({
      id: `opt_${idx + 1}`,
      optionText: opt,
      optionOrder: idx,
      isCorrect: idx === parsedQuestion.correctOptionIndex,
    }));

    await draftsCol.updateOne(
      { _id: draft._id },
      {
        $set: {
          questionText: parsedQuestion.question,
          optionsJson: updatedOptions,
          explanation: parsedQuestion.explanation,
          difficulty: parsedQuestion.difficulty || draft.difficulty,
          tagsJson: parsedQuestion.tags || draft.tagsJson,
          updatedAt: now,
        },
      }
    );

    const updatedDraft = await draftsCol.findOne({ _id: draft._id });
    return {
      success: true,
      draft: {
        ...updatedDraft,
        id: updatedDraft?._id?.toString(),
      },
    };
  }
}
