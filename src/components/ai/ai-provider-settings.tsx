"use client";

import * as React from "react";
import { Sparkles, Key, CheckCircle, AlertCircle, Loader2, Save } from "lucide-react";
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

interface ProviderConfig {
  id: string;
  provider: "GEMINI" | "OPENAI" | "ANTHROPIC";
  maskedKey: string;
  defaultModel: string;
  isDefault: boolean;
  isEnabled: boolean;
  updatedAt: string;
}

const PROVIDER_MODELS: Record<string, string[]> = {
  GEMINI: [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ],
  OPENAI: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
  ANTHROPIC: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
};


export function AIProviderSettings() {
  const [configs, setConfigs] = React.useState<ProviderConfig[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Active form state
  const [selectedProvider, setSelectedProvider] = React.useState<"GEMINI" | "OPENAI" | "ANTHROPIC">("GEMINI");
  const [apiKey, setApiKey] = React.useState("");
  const [model, setModel] = React.useState(PROVIDER_MODELS.GEMINI[0]);
  const [isDefault, setIsDefault] = React.useState(true);

  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const loadConfigs = async () => {
    try {
      const res = await fetch("/api/ai/config");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadConfigs();
  }, []);

  const handleProviderChange = (prov: "GEMINI" | "OPENAI" | "ANTHROPIC") => {
    setSelectedProvider(prov);
    setModel(PROVIDER_MODELS[prov][0]);
    setApiKey("");
    setTestResult(null);
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
      await loadConfigs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeExisting = configs.find((c) => c.provider === selectedProvider);

  return (
    <div className="space-y-6">
      {/* Existing Configured Providers */}
      {configs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Configured AI Providers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {configs.map((c) => (
              <Card key={c.id} className="p-4 border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{c.provider}</span>
                  {c.isDefault && <Badge variant="purple">Default</Badge>}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{c.maskedKey}</p>
                <p className="text-xs text-muted-foreground mt-1">Model: {c.defaultModel}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add / Update Provider Form */}
      <Card className="border shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-4 w-4 text-purple-600" />
            <span>Bring Your Own Key (BYOK) Configuration</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Your API keys are encrypted with AES-256-GCM authenticated server-side encryption. They are never sent to client browsers or logged.
          </CardDescription>
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
                    {isConfigured && (
                      <span className="text-[10px] text-emerald-600 font-medium">Configured</span>
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
                placeholder="Paste your API key here (e.g. AIzaSy... or sk-...)"
                required
              />
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Default Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_MODELS[selectedProvider]?.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                className={`flex items-start gap-2 rounded-lg p-3 text-xs font-medium border ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
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
                <span>{testing ? "Testing..." : "Test Connection"}</span>
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
    </div>
  );
}
