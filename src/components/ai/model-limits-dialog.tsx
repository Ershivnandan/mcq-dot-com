"use client";

import * as React from "react";
import {
  Gauge,
  Activity,
  Zap,
  CheckCircle2,
  Cpu,
  Sparkles,
  Info,
  Clock,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GEMINI_MODELS, PROVIDER_MODELS_MAP, AIModelOption } from "@/lib/constants/ai-models";
import { useAIUsageQuery } from "@/hooks/queries/use-ai";

interface ModelLimitsDialogProps {
  provider?: string;
  trigger?: React.ReactNode;
}

export function ModelLimitsDialog({ provider = "GEMINI", trigger }: ModelLimitsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { data: usage, isLoading: loading } = useAIUsageQuery();
  const [activeTab, setActiveTab] = React.useState<"models" | "usage">("models");

  const models: AIModelOption[] = PROVIDER_MODELS_MAP[provider] || GEMINI_MODELS;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer"
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>Usage & Rate Limits</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                API Key Usage Limits & Available Models
              </DialogTitle>
              <DialogDescription className="text-xs">
                Inspect Google Gemini rate limits, daily quotas, context windows, and real-time usage stats.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b border-border gap-4 mt-2">
          <button
            type="button"
            onClick={() => setActiveTab("models")}
            className={`pb-2 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === "models"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Available Models & Quotas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("usage")}
            className={`pb-2 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === "usage"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Your Live API Usage
          </button>
        </div>

        {activeTab === "models" ? (
          <div className="space-y-4 pt-2">
            {/* Free Tier Notice */}
            <div className="flex items-start gap-2.5 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-xs">
              <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">Google Gemini Free Tier</p>
                <p className="text-muted-foreground leading-relaxed">
                  Google Generative Language API keys provide a generous free quota at zero cost. Each model has its own requests-per-minute (RPM) and requests-per-day (RPD) ceilings.
                </p>
              </div>
            </div>

            {/* Models Table / Cards */}
            <div className="space-y-2.5">
              {models.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border bg-card p-3 space-y-2 shadow-2xs hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{m.name}</span>
                      <span className="text-[10px] rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold px-2 py-0.5">
                        {m.badge}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {m.id}
                    </span>
                  </div>

                  {m.description && (
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/50 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block">Free RPM:</span>
                      <span className="font-bold text-foreground">{m.freeRpm || "15 RPM"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Free Daily Quota:</span>
                      <span className="font-bold text-foreground">{m.freeRpd || "1,500 RPD"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Tokens/min:</span>
                      <span className="font-bold text-foreground">{m.freeTpm || "1M TPM"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Context Window:</span>
                      <span className="font-bold text-foreground">{m.contextWindow || "1M tokens"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Live Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-card p-3 text-center space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">Today's Requests</span>
                <span className="text-xl font-black text-purple-600">
                  {usage?.requestsToday ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground block">of 1,500 / day</span>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">Total Questions</span>
                <span className="text-xl font-black text-emerald-600">
                  {usage?.totalQuestionsGenerated ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground block">generated</span>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">Total API Calls</span>
                <span className="text-xl font-black text-foreground">
                  {usage?.totalRequests ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground block">all time</span>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">Success Rate</span>
                <span className="text-xl font-black text-blue-600">
                  {usage?.totalRequests > 0
                    ? `${Math.round(((usage.successfulRequests || 0) / usage.totalRequests) * 100)}%`
                    : "100%"}
                </span>
                <span className="text-[10px] text-muted-foreground block">reliability</span>
              </div>
            </div>

            {/* Model Breakdown */}
            {usage?.byModel && Object.keys(usage.byModel).length > 0 && (
              <div className="space-y-2 rounded-lg border bg-card p-3">
                <h4 className="text-xs font-bold text-foreground">Requests by Model</h4>
                <div className="space-y-1.5">
                  {Object.entries(usage.byModel).map(([modelId, count]: any) => (
                    <div key={modelId} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-muted-foreground">{modelId}</span>
                      <span className="font-bold text-foreground">{count} calls</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Requests Log */}
            {usage?.recentLogs && usage.recentLogs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Recent Generations</h4>
                <div className="space-y-1.5">
                  {usage.recentLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded-md border text-xs bg-muted/20"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            log.status === "SUCCESS" ? "bg-emerald-500" : "bg-destructive"
                          }`}
                        />
                        <span className="font-mono">{log.model}</span>
                        <span className="text-muted-foreground">({log.questionCount} questions)</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {usage?.totalRequests === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                No generations recorded yet. Use the prompt injector or generator to generate your first MCQ!
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
