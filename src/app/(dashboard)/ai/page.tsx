"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Key, CheckCheck, AlertCircle, Layers, Trash2 } from "lucide-react";
import { AIGeneratorPanel } from "@/components/ai/ai-generator-panel";
import { AIDraftCard } from "@/components/ai/ai-draft-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAIDraftsQuery,
  useAIConfigsQuery,
  useApproveDraftMutation,
  useRejectDraftMutation,
  useClearDraftsMutation,
  AI_QUERY_KEY,
} from "@/hooks/queries/use-ai";
import { useQueryClient } from "@tanstack/react-query";
import { QUESTIONS_QUERY_KEY } from "@/hooks/queries/use-questions";
import { TOPICS_QUERY_KEY } from "@/hooks/queries/use-topics";

export default function AIPage() {
  const queryClient = useQueryClient();
  const { data: drafts = [], isLoading: draftsLoading } = useAIDraftsQuery();
  const { data: configs = [], isLoading: configsLoading } = useAIConfigsQuery();

  const approveDraftMutation = useApproveDraftMutation();
  const rejectDraftMutation = useRejectDraftMutation();
  const clearDraftsMutation = useClearDraftsMutation();

  const [approvingAll, setApprovingAll] = React.useState(false);
  const [clearingAll, setClearingAll] = React.useState(false);
  const loading = draftsLoading || configsLoading;

  const handleApprove = async (id: string, overrides?: any) => {
    try {
      await approveDraftMutation.mutateAsync({ id, overrides });
    } catch (err: any) {
      alert(err.message || "Failed to approve draft.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectDraftMutation.mutateAsync(id);
    } catch {
      // Ignore
    }
  };

  const handleClearAll = async () => {
    if (drafts.length === 0) return;
    if (!confirm("Are you sure you want to clear all pending draft questions?")) return;
    setClearingAll(true);
    try {
      await clearDraftsMutation.mutateAsync();
    } catch (err: any) {
      alert(err.message || "Failed to clear pending drafts.");
    } finally {
      setClearingAll(false);
    }
  };

  const handleApproveAll = async () => {
    if (drafts.length === 0) return;
    setApprovingAll(true);
    try {
      for (const draft of drafts) {
        await fetch(`/api/ai/drafts/${draft.id}/approve`, { method: "POST" });
      }
      queryClient.invalidateQueries({ queryKey: [...AI_QUERY_KEY, "drafts"] });
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
    } catch {
      // Ignore
    } finally {
      setApprovingAll(false);
    }
  };

  const activeProvider =
    configs.find((c) => c.isDefault)?.provider || configs[0]?.provider || null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-600" />
            <span>AI Question Generator</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Generate exam-grade questions with your own LLM keys. Review, edit, and approve drafts.
          </p>
        </div>

        <Link href="/settings/ai">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Key className="h-3.5 w-3.5 text-purple-500" />
            <span>Manage AI Keys</span>
          </Button>
        </Link>
      </div>

      {/* Warning if no key configured */}
      {configs.length === 0 && !loading && (
        <div className="flex items-start gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-foreground">No AI Provider Configured</p>
            <p className="text-xs text-muted-foreground">
              To start generating questions with AI, add your personal Google Gemini, OpenAI, or Anthropic API key in Settings.
            </p>
            <Link href="/settings/ai" className="inline-block pt-1">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-7">
                Configure API Key Now
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Generator Prompt Panel */}
      <AIGeneratorPanel
        onGenerated={() => {
          queryClient.invalidateQueries({ queryKey: [...AI_QUERY_KEY, "drafts"] });
        }}
        activeProvider={activeProvider}
        configs={configs}
      />

      {/* Drafts Review Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              <span>Pending Drafts ({drafts.length})</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Review each question below before adding it to your permanent question library.
            </p>
          </div>

          {drafts.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={clearingAll || approvingAll}
                className="gap-1.5 font-semibold text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{clearingAll ? "Clearing..." : "Clear All Pending"}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleApproveAll}
                disabled={approvingAll || clearingAll}
                className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
              >
                <CheckCheck className="h-4 w-4" />
                <span>{approvingAll ? "Approving All..." : "Approve All Drafts"}</span>
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center space-y-2 bg-muted/20">
            <p className="text-sm font-semibold text-foreground">No Pending Drafts</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Use the prompt box above to generate new questions. They will appear here for your review and approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <AIDraftCard
                key={draft.id}
                draft={draft}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
