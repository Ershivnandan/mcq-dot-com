"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUESTIONS_QUERY_KEY } from "./use-questions";
import { TOPICS_QUERY_KEY } from "./use-topics";

export interface AIProviderConfigResponse {
  id: string;
  provider: "GEMINI" | "OPENAI" | "ANTHROPIC";
  maskedKey: string;
  defaultModel: string;
  isDefault: boolean;
  isEnabled: boolean;
  detectedModels?: string[];
  updatedAt: string;
}

export const AI_QUERY_KEY = ["ai"] as const;

/**
 * Hook to fetch user's saved AI provider configs.
 */
export function useAIConfigsQuery() {
  return useQuery<AIProviderConfigResponse[]>({
    queryKey: [...AI_QUERY_KEY, "configs"],
    queryFn: async () => {
      const res = await fetch("/api/ai/config");
      if (!res.ok) throw new Error("Failed to fetch AI configurations");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

/**
 * Hook to fetch aggregated AI usage stats and logs.
 */
export function useAIUsageQuery() {
  return useQuery({
    queryKey: [...AI_QUERY_KEY, "usage"],
    queryFn: async () => {
      const res = await fetch("/api/ai/usage");
      if (!res.ok) throw new Error("Failed to fetch AI usage logs");
      return res.json();
    },
  });
}

/**
 * Hook to fetch pending AI drafts.
 */
export function useAIDraftsQuery() {
  return useQuery<any[]>({
    queryKey: [...AI_QUERY_KEY, "drafts"],
    queryFn: async () => {
      const res = await fetch("/api/ai/drafts");
      if (!res.ok) throw new Error("Failed to fetch AI drafts");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

/**
 * Hook to save or update an AI provider's API key and default model.
 */
export function useSaveAIConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      provider: "GEMINI" | "OPENAI" | "ANTHROPIC";
      apiKey: string;
      defaultModel?: string;
      isDefault?: boolean;
    }) => {
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save AI configuration");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...AI_QUERY_KEY, "configs"] });
    },
  });
}

export interface ApproveDraftParams {
  id: string;
  overrides?: {
    questionText?: string;
    explanation?: string;
    options?: any[];
    topicId?: string | null;
    questionDate?: string | Date | null;
    difficulty?: string;
  };
}

/**
 * Hook to approve an AI generated draft.
 */
export function useApproveDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (arg: string | ApproveDraftParams) => {
      const draftId = typeof arg === "string" ? arg : arg.id;
      const overrides = typeof arg === "string" ? undefined : arg.overrides;

      const res = await fetch(`/api/ai/drafts/${draftId}/approve`, {
        method: "POST",
        headers: overrides ? { "Content-Type": "application/json" } : undefined,
        body: overrides ? JSON.stringify(overrides) : undefined,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to approve draft");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...AI_QUERY_KEY, "drafts"] });
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
    },
  });
}

/**
 * Hook to reject an AI draft.
 */
export function useRejectDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string) => {
      const res = await fetch(`/api/ai/drafts/${draftId}/reject`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to reject draft");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...AI_QUERY_KEY, "drafts"] });
    },
  });
}
