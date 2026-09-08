import {
  getAIProviderConfigsCol,
  getAIDraftsCol,
  getAIUsageLogsCol,
  getTopicsCol,
  getCategoriesCol,
  toObjectId,
  formatDoc,
  formatDocs,
} from "@/server/db";
import { encryptApiKey, decryptApiKey, maskApiKey } from "@/server/encryption/crypto";
import { GeminiProvider } from "@/server/providers/gemini.provider";
import { OpenAIProvider } from "@/server/providers/openai.provider";
import { AnthropicProvider } from "@/server/providers/anthropic.provider";
import { AIProvider } from "@/server/providers/ai-provider.interface";
import { z } from "zod";
import { AIConfigInputSchema, AIGenerateRequestSchema } from "@/lib/validation/schemas";
import { QuestionService } from "./question.service";

export type AIConfigInput = z.infer<typeof AIConfigInputSchema>;
export type AIGenerateRequest = z.infer<typeof AIGenerateRequestSchema>;

function getProviderInstance(provider: "GEMINI" | "OPENAI" | "ANTHROPIC"): AIProvider {
  switch (provider) {
    case "GEMINI":
      return new GeminiProvider();
    case "OPENAI":
      return new OpenAIProvider();
    case "ANTHROPIC":
      return new AnthropicProvider();
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export class AIService {
  /**
   * Retrieves all configured AI providers for the user (with masked keys for security).
   */
  static async getUserConfigs(userId: string) {
    const col = await getAIProviderConfigsCol();
    const configs = await col.find({ userId }).sort({ createdAt: 1 }).toArray();

    return configs.map((c) => ({
      id: c._id ? c._id.toString() : c.id,
      provider: c.provider,
      maskedKey: maskApiKey(
        decryptApiKey({
          encryptedKey: c.encryptedKey,
          iv: c.iv,
          tag: c.tag,
        })
      ),
      defaultModel: c.defaultModel,
      isDefault: c.isDefault,
      isEnabled: c.isEnabled,
      detectedModels: (c as any).detectedModels || [],
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * Saves or updates an AI provider's API key, encrypting it with AES-256-GCM.
   */
  static async saveConfig(userId: string, input: AIConfigInput) {
    const { encryptedKey, iv, tag } = encryptApiKey(input.apiKey);
    const col = await getAIProviderConfigsCol();
    const now = new Date();

    // If marked default, unset other defaults
    if (input.isDefault) {
      await col.updateMany({ userId }, { $set: { isDefault: false } });
    }

    // Try to auto-detect models for this key if supported
    let detectedModels: string[] = [];
    try {
      const providerInstance = getProviderInstance(input.provider);
      const testRes = await providerInstance.testConnection(input.apiKey);
      if (testRes.success && testRes.models && testRes.models.length > 0) {
        detectedModels = testRes.models;
      }
    } catch {
      // Ignore if test fails during save
    }

    const updateDoc: any = {
      userId,
      provider: input.provider,
      encryptedKey,
      iv,
      tag,
      defaultModel: input.defaultModel,
      isDefault: input.isDefault,
      isEnabled: true,
      updatedAt: now,
    };

    if (detectedModels.length > 0) {
      updateDoc.detectedModels = detectedModels;
    }

    const res = await col.findOneAndUpdate(
      { userId, provider: input.provider },
      {
        $set: updateDoc,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: "after" }
    );

    return {
      id: res?._id?.toString(),
      provider: res?.provider,
      defaultModel: res?.defaultModel,
      isDefault: res?.isDefault,
      detectedModels,
    };
  }

  /**
   * Tests an API key connection against the live provider.
   */
  static async testConnection(provider: "GEMINI" | "OPENAI" | "ANTHROPIC", apiKey: string) {
    const providerInstance = getProviderInstance(provider);
    return providerInstance.testConnection(apiKey);
  }

  /**
   * Retrieves usage statistics and request counts for the user's AI activity.
   */
  static async getUsageStats(userId: string) {
    const logsCol = await getAIUsageLogsCol();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allLogs = await logsCol.find({ userId }).sort({ createdAt: -1 }).limit(200).toArray();

    const totalRequests = allLogs.length;
    const successfulRequests = allLogs.filter((l) => l.status === "SUCCESS").length;
    const failedRequests = allLogs.filter((l) => l.status === "FAILED").length;
    const totalQuestionsGenerated = allLogs.reduce((acc, l) => acc + (l.questionCount || 0), 0);
    const requestsToday = allLogs.filter((l) => new Date(l.createdAt) >= startOfToday).length;

    // Usage by model
    const byModel: Record<string, number> = {};
    for (const log of allLogs) {
      if (log.model) {
        byModel[log.model] = (byModel[log.model] || 0) + 1;
      }
    }

    // Provider configs
    const configsCol = await getAIProviderConfigsCol();
    const configs = await configsCol.find({ userId }).toArray();
    const activeConfig = configs.find((c) => c.isDefault && c.isEnabled) || configs[0];

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalQuestionsGenerated,
      requestsToday,
      byModel,
      activeProvider: activeConfig?.provider || null,
      defaultModel: activeConfig?.defaultModel || null,
      detectedModels: (activeConfig as any)?.detectedModels || [],
      recentLogs: allLogs.slice(0, 5).map((l) => ({
        id: l._id?.toString(),
        model: l.model,
        provider: l.provider,
        durationMs: l.durationMs,
        questionCount: l.questionCount,
        status: l.status,
        createdAt: l.createdAt,
      })),
    };
  }

  /**
   * Generates questions using the user's selected provider and saves them as DRAFTS for review.
   */
  static async generateQuestions(userId: string, input: AIGenerateRequest) {
    const col = await getAIProviderConfigsCol();

    // Find provider config
    let config = null;
    if (input.provider) {
      config = await col.findOne({ userId, provider: input.provider });
    } else {
      config = await col.findOne({ userId, isDefault: true, isEnabled: true });
      if (!config) {
        config = await col.findOne({ userId, isEnabled: true });
      }
    }

    if (!config) {
      throw new Error(
        "No active AI provider configured. Please configure an API key in Settings > AI first."
      );
    }

    // Decrypt key
    const rawApiKey = decryptApiKey({
      encryptedKey: config.encryptedKey,
      iv: config.iv,
      tag: config.tag,
    });

    const providerInstance = getProviderInstance(config.provider);
    const activeModel = input.model || config.defaultModel;

    const startTime = Date.now();
    const logsCol = await getAIUsageLogsCol();
    const draftsCol = await getAIDraftsCol();

    try {
      const generated = await providerInstance.generateQuestions(
        rawApiKey,
        activeModel,
        {
          prompt: input.prompt,
          count: input.count,
          difficulty: input.difficulty,
          topic: input.topic,
          category: input.category,
          researchEnabled: input.researchEnabled,
          contextData: input.contextData,
        }
      );

      const durationMs = Date.now() - startTime;
      const now = new Date();

      // Save drafts to database
      const draftDocs = generated.map((q) => ({
        userId,
        prompt: input.prompt,
        questionText: q.question,
        optionsJson: q.options.map((opt, idx) => ({
          id: `opt_${idx + 1}`,
          optionText: opt,
          optionOrder: idx,
          isCorrect: idx === q.correctOptionIndex,
        })),
        explanation: q.explanation || "",
        topic: q.topic || input.topic || "General",
        category: q.category || input.category || "General",
        difficulty: q.difficulty || input.difficulty || "MEDIUM",
        tagsJson: q.tags || [],
        relatedJson: q.relatedQuestions || [],
        status: "DRAFT" as const,
        createdAt: now,
        updatedAt: now,
      }));

      const insertRes = await draftsCol.insertMany(draftDocs);
      const insertedDrafts = draftDocs.map((doc, idx) => ({
        ...doc,
        _id: insertRes.insertedIds[idx],
        id: insertRes.insertedIds[idx].toString(),
      }));

      // Log usage
      await logsCol.insertOne({
        userId,
        provider: config.provider,
        model: activeModel,
        durationMs,
        questionCount: insertedDrafts.length,
        status: "SUCCESS",
        createdAt: now,
      });

      return formatDocs(insertedDrafts);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await logsCol.insertOne({
        userId,
        provider: config.provider,
        model: activeModel,
        durationMs,
        questionCount: 0,
        status: "FAILED",
        errorMessage: error.message,
        createdAt: new Date(),
      });
      throw error;
    }
  }

  /**
   * Retrieves pending draft questions for user review.
   */
  static async getDrafts(userId: string) {
    const col = await getAIDraftsCol();
    const drafts = await col.find({ userId, status: "DRAFT" }).sort({ createdAt: -1 }).toArray();
    return formatDocs(drafts);
  }

  /**
   * Approves an AI draft and moves it directly into the user's permanent question library.
   */
  static async approveDraft(userId: string, draftId: string) {
    const draftsCol = await getAIDraftsCol();
    const draft = await draftsCol.findOne({ _id: toObjectId(draftId), userId });

    if (!draft) throw new Error("Draft not found");

    const options = (draft.optionsJson as any[]) || [];

    // Ensure topic exists or create it
    let topicId = null;
    if (draft.topic) {
      const topicsCol = await getTopicsCol();
      const slug = draft.topic.toLowerCase().replace(/\s+/g, "-");
      const topic = await topicsCol.findOneAndUpdate(
        { userId, name: draft.topic },
        {
          $setOnInsert: {
            userId,
            name: draft.topic,
            slug,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after" }
      );
      topicId = topic?._id?.toString() || null;
    }

    // Ensure category exists or create it
    let categoryId = null;
    if (draft.category) {
      const categoriesCol = await getCategoriesCol();
      const slug = draft.category.toLowerCase().replace(/\s+/g, "-");
      const cat = await categoriesCol.findOneAndUpdate(
        { userId, name: draft.category },
        {
          $setOnInsert: {
            userId,
            name: draft.category,
            slug,
            topicId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after" }
      );
      categoryId = cat?._id?.toString() || null;
    }

    // Create the permanent Question
    const question = await QuestionService.createQuestion(userId, {
      questionText: draft.questionText,
      explanation: draft.explanation,
      difficulty: draft.difficulty as any,
      topicId,
      categoryId,
      options: options.map((o: any, idx: number) => ({
        id: o.id || `opt_${idx + 1}`,
        optionText: o.optionText || o.text || "",
        optionOrder: o.optionOrder ?? idx,
        isCorrect: Boolean(o.isCorrect),
      })),
      isFavorite: false,
      isArchived: false,
      tagIds: [],
      collectionIds: [],
    });

    // Mark draft as approved
    await draftsCol.updateOne(
      { _id: toObjectId(draftId) },
      { $set: { status: "APPROVED", updatedAt: new Date() } }
    );

    return question;
  }

  /**
   * Rejects an AI draft.
   */
  static async rejectDraft(userId: string, draftId: string) {
    const draftsCol = await getAIDraftsCol();
    await draftsCol.updateOne(
      { _id: toObjectId(draftId), userId },
      { $set: { status: "REJECTED", updatedAt: new Date() } }
    );
    return true;
  }
}
