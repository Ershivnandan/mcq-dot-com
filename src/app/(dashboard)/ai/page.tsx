"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Key,
  CheckCheck,
  AlertCircle,
  Layers,
  Trash2,
  Search,
  BookOpen,
  Filter,
} from "lucide-react";
import { SplitPane } from "@/components/ui/split-pane";
import { AIChatPanel } from "@/components/ai/ai-chat-panel";
import { AIDraftCard } from "@/components/ai/ai-draft-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [draftSearch, setDraftSearch] = React.useState("");
  const [selectedRefineTarget, setSelectedRefineTarget] = React.useState<string | null>(null);

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

  // Filter drafts by search query
  const filteredDrafts = drafts.filter((d: any) => {
    if (!draftSearch.trim()) return true;
    const term = draftSearch.toLowerCase();
    return (
      d.questionText?.toLowerCase().includes(term) ||
      d.topic?.toLowerCase().includes(term) ||
      d.explanation?.toLowerCase().includes(term)
    );
  });

  const handleRefineInChat = (index: number, draftId: string) => {
    setSelectedRefineTarget(index.toString());
  };

  // Left Pane Content: Generated Questions Studio (75% default width)
  const leftQuestionsPane = (
    <div className="space-y-4 h-full flex flex-col">
      {/* Studio Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
            <Layers className="h-4 w-4 text-purple-600" />
            <span>Generated Questions</span>
          </div>
          <Badge variant="purple" className="font-mono text-xs">
            {drafts.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Draft Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="Search in drafts..."
              className="h-7 pl-8 text-xs bg-muted/30"
            />
          </div>

          {drafts.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={clearingAll || approvingAll}
                className="h-7 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1 font-semibold"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear All</span>
              </Button>

              <Button
                size="sm"
                onClick={handleApproveAll}
                disabled={approvingAll || clearingAll}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-bold shadow-sm"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{approvingAll ? "Approving..." : "Approve All"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Drafts Cards Container */}
      <div className="space-y-4 flex-1">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-purple-500/20 p-12 text-center space-y-4 bg-muted/10">
            <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-foreground">No Draft Questions Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the <strong>AI Chat Copilot</strong> on the right to enter any topic or paste a specific question.
                Your generated MCQs will appear here in the 75% preview workspace for review, editing, and approval.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium">
                ⚡ Drag divider to resize panels
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium">
                🎯 Exact question fidelity enabled
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium">
                🔍 Atlas RAG grounding active
              </span>
            </div>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No drafts match your search &quot;{draftSearch}&quot;.
          </div>
        ) : (
          filteredDrafts.map((draft: any, index: number) => (
            <AIDraftCard
              key={draft.id || draft._id}
              draft={draft}
              index={index}
              onApprove={handleApprove}
              onReject={handleReject}
              onRefineInChat={handleRefineInChat}
            />
          ))
        )}
      </div>
    </div>
  );

  // Right Pane Content: AI Interactive Chat & RAG (25% default width)
  const rightChatPane = (
    <AIChatPanel
      onGenerated={() => {
        queryClient.invalidateQueries({ queryKey: [...AI_QUERY_KEY, "drafts"] });
      }}
      activeProvider={activeProvider}
      configs={configs}
      onRefineTarget={selectedRefineTarget}
    />
  );

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-600" />
            <span>AI Question Studio & Copilot</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Interactive two-column studio with 75% draft workspace, 25% AI chat copilot, and draggable divider.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings/ai">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Key className="h-3.5 w-3.5 text-purple-500" />
              <span>Configure AI Keys</span>
            </Button>
          </Link>
        </div>
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

      {/* Draggable Split-Screen Layout: 75% Questions Preview | 25% AI Chat */}
      <SplitPane
        left={leftQuestionsPane}
        right={rightChatPane}
        defaultSplitPercent={75}
        minLeftPercent={45}
        maxLeftPercent={85}
      />
    </div>
  );
}
