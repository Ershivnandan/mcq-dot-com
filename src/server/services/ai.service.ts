import { prisma } from "@/server/db";
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
    const configs = await prisma.aIProviderConfig.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return configs.map((c) => ({
      id: c.id,
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
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * Saves or updates an AI provider's API key, encrypting it with AES-256-GCM.
   */
  static async saveConfig(userId: string, input: AIConfigInput) {
    const { encryptedKey, iv, tag } = encryptApiKey(input.apiKey);

    // If marked default, unset other defaults
    if (input.isDefault) {
      await prisma.aIProviderConfig.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const config = await prisma.aIProviderConfig.upsert({
      where: {
        userId_provider: {
          userId,
          provider: input.provider,
        },
      },
      create: {
        userId,
        provider: input.provider,
        encryptedKey,
        iv,
        tag,
        defaultModel: input.defaultModel,
        isDefault: input.isDefault,
        isEnabled: true,
      },
      update: {
        encryptedKey,
        iv,
        tag,
        defaultModel: input.defaultModel,
        isDefault: input.isDefault,
        isEnabled: true,
      },
    });

    return {
      id: config.id,
      provider: config.provider,
      defaultModel: config.defaultModel,
      isDefault: config.isDefault,
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
   * Generates questions using the user's selected provider and saves them as DRAFTS for review.
   */
  static async generateQuestions(userId: string, input: AIGenerateRequest) {
    // Find provider config
    let config = null;
    if (input.provider) {
      config = await prisma.aIProviderConfig.findUnique({
        where: {
          userId_provider: { userId, provider: input.provider },
        },
      });
    } else {
      config = await prisma.aIProviderConfig.findFirst({
        where: { userId, isDefault: true, isEnabled: true },
      });
      if (!config) {
        config = await prisma.aIProviderConfig.findFirst({
          where: { userId, isEnabled: true },
        });
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

      // Save drafts to database
      const drafts = await Promise.all(
        generated.map((q) =>
          prisma.aIDraftQuestion.create({
            data: {
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
              status: "DRAFT",
            },
          })
        )
      );

      // Log usage
      await prisma.aIUsageLog.create({
        data: {
          userId,
          provider: config.provider,
          model: activeModel,
          durationMs,
          questionCount: drafts.length,
          status: "SUCCESS",
        },
      });

      return drafts;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await prisma.aIUsageLog.create({
        data: {
          userId,
          provider: config.provider,
          model: activeModel,
          durationMs,
          questionCount: 0,
          status: "FAILED",
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Retrieves pending draft questions for user review.
   */
  static async getDrafts(userId: string) {
    return prisma.aIDraftQuestion.findMany({
      where: { userId, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Approves an AI draft and moves it directly into the user's permanent question library.
   */
  static async approveDraft(userId: string, draftId: string) {
    const draft = await prisma.aIDraftQuestion.findFirst({
      where: { id: draftId, userId },
    });

    if (!draft) throw new Error("Draft not found");

    const options = (draft.optionsJson as any[]) || [];

    // Ensure topic exists or create it
    let topicId = null;
    if (draft.topic) {
      const topic = await prisma.topic.upsert({
        where: { userId_name: { userId, name: draft.topic } },
        create: { userId, name: draft.topic, slug: draft.topic.toLowerCase().replace(/\s+/g, "-") },
        update: {},
      });
      topicId = topic.id;
    }

    // Ensure category exists or create it
    let categoryId = null;
    if (draft.category) {
      const category = await prisma.category.upsert({
        where: { userId_name: { userId, name: draft.category } },
        create: { userId, name: draft.category, slug: draft.category.toLowerCase().replace(/\s+/g, "-"), topicId },
        update: {},
      });
      categoryId = category.id;
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
    await prisma.aIDraftQuestion.update({
      where: { id: draftId },
      data: { status: "APPROVED" },
    });

    return question;
  }

  /**
   * Rejects an AI draft.
   */
  static async rejectDraft(userId: string, draftId: string) {
    return prisma.aIDraftQuestion.update({
      where: { id: draftId, userId },
      data: { status: "REJECTED" },
    });
  }
}
