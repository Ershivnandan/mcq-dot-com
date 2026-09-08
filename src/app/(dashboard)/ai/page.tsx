"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Key, CheckCheck, RefreshCw, AlertCircle, Layers } from "lucide-react";
import { AIGeneratorPanel } from "@/components/ai/ai-generator-panel";
import { AIDraftCard } from "@/components/ai/ai-draft-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIPage() {
  const [drafts, setDrafts] = React.useState<any[]>([]);
  const [configs, setConfigs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [approvingAll, setApprovingAll] = React.useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [draftsRes, configsRes] = await Promise.all([
        fetch("/api/ai/drafts"),
        fetch("/api/ai/config"),
      ]);

      if (draftsRes.ok) {
        const d = await draftsRes.json();
        setDrafts(Array.isArray(d) ? d : []);
      }
      if (configsRes.ok) {
        const c = await configsRes.json();
        setConfigs(Array.isArray(c) ? c : []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/ai/drafts/${id}/approve`, { method: "POST" });
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } else {
      const err = await res.json();
      alert(err.error || "Failed to approve draft.");
    }
  };

  const handleReject = async (id: string) => {
    const res = await fetch(`/api/ai/drafts/${id}/reject`, { method: "POST" });
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleApproveAll = async () => {
    setApprovingAll(true);
    try {
      for (const draft of drafts) {
        await fetch(`/api/ai/drafts/${draft.id}/approve`, { method: "POST" });
      }
      setDrafts([]);
    } catch {
      // Ignore
    } finally {
      setApprovingAll(false);
    }
  };

  const activeProvider = configs.find((c) => c.isDefault)?.provider || configs[0]?.provider || null;

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
      <AIGeneratorPanel onGenerated={loadData} activeProvider={activeProvider} />

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
            <Button
              size="sm"
              onClick={handleApproveAll}
              disabled={approvingAll}
              className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
            >
              <CheckCheck className="h-4 w-4" />
              <span>{approvingAll ? "Approving All..." : "Approve All Drafts"}</span>
            </Button>
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
