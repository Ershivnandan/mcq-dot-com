"use client";

import * as React from "react";
import { Sparkles, Loader2, BookOpen, Send, HelpCircle, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AIGeneratorPanelProps {
  onGenerated: () => void;
  activeProvider?: string | null;
}

export function AIGeneratorPanel({ onGenerated, activeProvider }: AIGeneratorPanelProps) {
  const [prompt, setPrompt] = React.useState("");
  const [count, setCount] = React.useState(5);
  const [difficulty, setDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [topic, setTopic] = React.useState("Computer Science");
  const [researchEnabled, setResearchEnabled] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          count,
          difficulty,
          topic: topic.trim() || "General",
          researchEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions.");
      }

      setPrompt("");
      onGenerated();
    } catch (err: any) {
      setError(err.message || "Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Generate 5 GATE-level DBMS normalization questions (BCNF, 3NF, functional dependencies)",
    "Create 5 tricky JavaScript questions on event loops, microtasks, and closures",
    "Generate 5 UPSC Indian Polity questions on Constitutional amendments and fundamental rights",
  ];

  return (
    <Card className="border-purple-500/30 shadow-md bg-gradient-to-b from-purple-500/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Question Generator</CardTitle>
              <CardDescription className="text-xs">
                Drafts are schema-validated and held for your review before entering the library.
              </CardDescription>
            </div>
          </div>
          {activeProvider && (
            <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
              Provider: {activeProvider}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              What kind of questions do you want to generate?
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Generate 5 medium-difficulty questions on React 19 Server Components and Suspense..."
              className="min-h-[85px] text-sm"
              required
            />
          </div>

          {/* Prompt suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground self-center mr-1">Try:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p)}
                className="text-[11px] rounded-full border border-purple-500/20 bg-purple-500/5 px-2.5 py-1 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40 transition-colors text-left"
              >
                {p.slice(0, 42)}...
              </button>
            ))}
          </div>

          {/* Configuration Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Topic / Subject</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. DBMS, Current Affairs"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
              <Select
                value={difficulty}
                onValueChange={(val: any) => setDifficulty(val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Count (1-20)</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={researchEnabled} onCheckedChange={setResearchEnabled} />
              <span className="text-xs font-medium text-muted-foreground">
                Enable Research Context Layer
              </span>
            </div>

            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="gap-2 font-bold bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Drafts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Questions</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
