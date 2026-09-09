"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TopicItem {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { questions: number };
}

export const TOPICS_QUERY_KEY = ["topics"] as const;

async function fetchTopics(): Promise<TopicItem[]> {
  const res = await fetch("/api/topics");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch topics");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Hook to retrieve all user topics with cached reactivity.
 */
export function useTopicsQuery() {
  return useQuery({
    queryKey: TOPICS_QUERY_KEY,
    queryFn: fetchTopics,
  });
}

/**
 * Hook to create a new user topic and auto-invalidate cache.
 */
export function useCreateTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      color?: string;
    }): Promise<TopicItem> => {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create topic");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
    },
  });
}

/**
 * Hook to update an existing user topic.
 */
export function useUpdateTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name: string;
      description?: string | null;
      color?: string | null;
    }): Promise<TopicItem> => {
      const res = await fetch(`/api/topics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update topic");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

/**
 * Hook to delete a topic.
 */
export function useDeleteTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/topics/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete topic");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}
