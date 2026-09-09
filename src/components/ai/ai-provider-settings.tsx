"use client";

import * as React from "react";
import {
  Sparkles,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Gauge,
  Cpu,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  PROVIDER_MODELS_MAP,
  GEMINI_MODELS,
  AIModelOption,
  DEFAULT_GEMINI_MODEL,
} from "@/lib/constants/ai-models";

interface ProviderConfig {
  id: string;
  provider: "GEMINI" | "OPENAI" | "ANTHROPIC";
  maskedKey: string;
  defaultModel: string;
  isDefault: boolean;
  isEnabled: boolean;
  detectedModels?: string[];
  updatedAt: string;
}

export function AIProviderSettings() {
  const [configs, setConfigs] = React.useState<ProviderConfig[]>([]);
  const [usage, setUsage] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Active form state
  const [selectedProvider, setSelectedProvider] = React.useState<"GEMINI" | "OPENAI" | "ANTHROPIC">("GEMINI");
  const [apiKey, setApiKey] = React.useState("");

  const availableModels: AIModelOption[] =
    PROVIDER_MODELS_MAP[selectedProvider] || GEMINI_MODELS;

  const [model, setModel] = React.useState<string>(availableModels[0]?.id || DEFAULT_GEMINI_MODEL);
  const [isDefault, setIsDefault] = React.useState(true);

  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
    models?: string[];
  } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const loadData = async () => {
    try {
      const [configsRes, usageRes] = await Promise.all([
        fetch("/api/ai/config"),
        fetch("/api/ai/usage"),
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data);
        // If there's an existing config for the selected provider, sync its default model
        const existing = data.find((c: ProviderConfig) => c.provider === selectedProvider);
        if (existing?.defaultModel) {
          setModel(existing.defaultModel);
        }
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
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

  const handleProviderChange = (prov: "GEMINI" | "OPENAI" | "ANTHROPIC") => {
    setSelectedProvider(prov);
    const modelsForProv = PROVIDER_MODELS_MAP[prov] || GEMINI_MODELS;
    const existing = configs.find((c) => c.provider === prov);
    setModel(existing?.defaultModel || modelsForProv[0]?.id || "");
    setApiKey("");
    setTestResult(null);
    setSaveSuccess(false);
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      alert("Please enter an API key to test.");
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? "Connection successful!" : "Failed to connect."),
        models: data.models,
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      alert("Please enter an API key.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
          defaultModel: model,
          isDefault,
        }),
      });

      if (!res.ok) throw new Error("Failed to save configuration.");

      setApiKey("");
      setSaveSuccess(true);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeExisting = configs.find((c) => c.provider === selectedProvider);
  const selectedModelDetails = availableModels.find((m) => m.id === model);

  return (
    <div className="space-y-6">
      {/* API Key Usage & Limits Monitor */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
                <Gauge className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">API Key Usage & Rate Limits</CardTitle>
                <CardDescription className="text-xs">
                  Track your daily API quota and monitor requests made with your API keys.
                </CardDescription>
              </div>
            </div>
            {usage?.requestsToday !== undefined && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {usage.requestsToday} requests today
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <span className="text-[11px] text-muted-foreground block">Today's Usage</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">{usage?.requestsToday ?? 0}</span>
                <span className="text-xs text-muted-foreground">/ 1,500 RPD</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((usage?.requestsToday || 0) / 1500) * 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-3 space-y-1">
              <span className="text-[11px] text-muted-foreground block">Total Questions Created</span>
              <span className="text-xl font-bold text-emerald-600">
                {usage?.totalQuestionsGenerated ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground block">via AI drafts</span>
            </div>

            <div className="rounded-lg border bg-card p-3 space-y-1">
              <span className="text-[11px] text-muted-foreground block">All-Time Requests</span>
              <span className="text-xl font-bold text-foreground">
                {usage?.totalRequests ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground block">total API calls</span>
            </div>

            <div className="rounded-lg border bg-card p-3 space-y-1">
              <span className="text-[11px] text-muted-foreground block">Free Tier Limits</span>
              <span className="text-sm font-bold text-purple-600 block pt-0.5">
                15 RPM · 1,500/day
              </span>
              <span className="text-[10px] text-muted-foreground block">Standard Flash quota</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Configured Providers */}
      {configs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Configured AI Providers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {configs.map((c) => (
              <Card key={c.id} className="p-4 border shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{c.provider}</span>
                  {c.isDefault && <Badge variant="purple">Default</Badge>}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{c.maskedKey}</p>
                <div className="flex items-center justify-between pt-1 border-t text-[11px] text-muted-foreground">
                  <span>Model: <strong>{c.defaultModel}</strong></span>
                  {c.detectedModels && c.detectedModels.length > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ {c.detectedModels.length} models
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add / Update Provider Form */}
      <Card className="border shadow-md">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-600" />
                <span>Configure API Key & Models</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Your API keys are encrypted with AES-256-GCM authenticated server-side encryption. They are never logged or exposed.
              </CardDescription>
            </div>
            {selectedProvider === "GEMINI" && (
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <span>Get Google Gemini API Key</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            {/* Provider Tabs / Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {(["GEMINI", "OPENAI", "ANTHROPIC"] as const).map((prov) => {
                const isConfigured = configs.some((c) => c.provider === prov);
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => handleProviderChange(prov)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                      selectedProvider === prov
                        ? "border-purple-600 bg-purple-500/5 text-purple-700 dark:text-purple-300 font-bold"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <span className="text-sm">{prov}</span>
                    {isConfigured ? (
                      <span className="text-[10px] text-emerald-600 font-medium">Configured</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Not set</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  {selectedProvider} API Key
                </label>
                {activeExisting && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Current: {activeExisting.maskedKey}
                  </span>
                )}
              </div>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here (e.g. AIzaSy...)"
                required
              />
            </div>

            {/* Model Selector with limits & badges */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-purple-600" />
                  <span>Default Model</span>
                </label>
                {selectedModelDetails?.limitsSummary && (
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                    Limits: {selectedModelDetails.limitsSummary}
                  </span>
                )}
              </div>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      <div className="flex items-center justify-between gap-3 py-0.5">
                        <span className="font-semibold">{m.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {m.freeRpd && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {m.freeRpd}
                            </span>
                          )}
                          <span className="text-[10px] rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 px-1.5 py-0.2 font-medium">
                            {m.badge}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Model Spec Preview Box */}
            {selectedModelDetails && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{selectedModelDetails.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{selectedModelDetails.id}</span>
                </div>
                {selectedModelDetails.description && (
                  <p className="text-muted-foreground">{selectedModelDetails.description}</p>
                )}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">Free Limit:</span>
                    <span className="font-semibold">{selectedModelDetails.freeRpm || "15 RPM"} · {selectedModelDetails.freeRpd || "1,500 RPD"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Context Window:</span>
                    <span className="font-semibold">{selectedModelDetails.contextWindow || "1M tokens"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Tier:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedModelDetails.tier || "Free Tier Available"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Set as default switch */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Set as Default Provider</p>
                <p className="text-[11px] text-muted-foreground">
                  Used automatically when generating questions or explanations.
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            {/* Test Connection Output */}
            {testResult && (
              <div
                className={`flex flex-col gap-2 rounded-lg p-3 text-xs font-medium border ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>

                {testResult.models && testResult.models.length > 0 && (
                  <div className="pt-1 border-t border-emerald-500/20">
                    <p className="text-[11px] font-semibold text-foreground mb-1">
                      Models verified and available for your key ({testResult.models.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {testResult.models.map((mod) => (
                        <span
                          key={mod}
                          className="rounded bg-background/80 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono text-foreground"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                ✅ API key saved and encrypted successfully!
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestKey}
                disabled={testing || !apiKey.trim()}
                className="gap-1.5 text-xs"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>{testing ? "Testing Key..." : "Test Connection"}</span>
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={saving || !apiKey.trim()}
                className="gap-2 font-bold bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Encrypting & Saving..." : "Save API Key"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Available Models & Quotas Reference Card */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-600" />
            <span>{selectedProvider} Models & Quotas Reference</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Compare reasoning power, rate limits, and token context across all available models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableModels.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border bg-card p-3 space-y-2 hover:border-purple-500/40 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground">{m.name}</span>
                    <span className="text-[10px] rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 font-semibold">
                      {m.badge}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModel(m.id)}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                  >
                    Select
                  </button>
                </div>
                {m.description && (
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                )}
                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-border/50 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Free RPM</span>
                    <span className="font-bold text-foreground">{m.freeRpm || "15 RPM"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Daily Quota</span>
                    <span className="font-bold text-foreground">{m.freeRpd || "1,500 RPD"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Context</span>
                    <span className="font-bold text-foreground">{m.contextWindow || "1M tokens"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
