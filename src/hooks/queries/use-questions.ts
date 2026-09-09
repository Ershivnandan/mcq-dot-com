"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TOPICS_QUERY_KEY } from "./use-topics";

export interface QuestionFiltersQueryParams {
  search?: string;
  topicId?: string;
  difficulty?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface QuestionListResponse {
  questions: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const QUESTIONS_QUERY_KEY = ["questions"] as const;

async function fetchQuestions(
  params: QuestionFiltersQueryParams
): Promise<QuestionListResponse> {
  const urlParams = new URLSearchParams();
  if (params.search) urlParams.set("search", params.search);
  if (params.topicId) urlParams.set("topicId", params.topicId);
  if (params.difficulty) urlParams.set("difficulty", params.difficulty);
  if (params.isFavorite) urlParams.set("isFavorite", "true");
  if (params.isArchived) urlParams.set("isArchived", "true");
  if (params.dateFrom) urlParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) urlParams.set("dateTo", params.dateTo);
  urlParams.set("page", String(params.page || 1));
  urlParams.set("limit", String(params.limit || 20));

  const res = await fetch(`/api/questions?${urlParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch questions");
  }

  return res.json();
}

/**
 * Hook to retrieve questions based on active filters and pagination.
 */
export function useQuestionsQuery(params: QuestionFiltersQueryParams) {
  return useQuery({
    queryKey: [...QUESTIONS_QUERY_KEY, params],
    queryFn: () => fetchQuestions(params),
  });
}

/**
 * Hook to retrieve a single question by its ID.
 */
export function useQuestionByIdQuery(id?: string) {
  return useQuery({
    queryKey: [...QUESTIONS_QUERY_KEY, "detail", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/questions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch question");
      return res.json();
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook to create a new question and invalidate queries.
 */
export function useCreateQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create question");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
    },
  });
}

/**
 * Hook to update an existing question.
 */
export function useUpdateQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update question");
      }

      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUESTIONS_QUERY_KEY, "detail", id] });
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
    },
  });
}

/**
 * Hook to delete a single question.
 */
export function useDeleteQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete question");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
    },
  });
}

/**
 * Hook to toggle favorite status with automatic cache refresh.
 */
export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleFavorite" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to toggle favorite");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
    },
  });
}

/**
 * Hook to execute bulk operations (favorite, archive, delete).
 */
export function useBulkQuestionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionIds,
      action,
      payload,
    }: {
      questionIds: string[];
      action: "favorite" | "unfavorite" | "archive" | "restore" | "delete" | "set_difficulty" | "set_topic";
      payload?: any;
    }) => {
      const res = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds, action, payload }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to execute bulk action");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
    },
  });
}
