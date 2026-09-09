"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Sparkles, Clock, Shuffle, CheckCircle, Repeat, HelpCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface QuizCreatorProps {
  topics: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; topicId?: string | null }>;
}

export function QuizCreator({ topics, categories }: QuizCreatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDueMode = searchParams.get("due") === "true";

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState(
    isDueMode ? "Daily Spaced Repetition Quiz" : "Practice Quiz"
  );
  const [mode, setMode] = React.useState<"PRACTICE" | "EXAM">("PRACTICE");
  const [questionCount, setQuestionCount] = React.useState(20);
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState<number>(15);

  // Filters
  const [topicId, setTopicId] = React.useState<string>("");
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [difficulty, setDifficulty] = React.useState<string>("");
  const [onlyFavorites, setOnlyFavorites] = React.useState(false);
  const [onlyIncorrect, setOnlyIncorrect] = React.useState(false);
  const [shuffleQuestions, setShuffleQuestions] = React.useState(true);
  const [shuffleOptions, setShuffleOptions] = React.useState(true);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        title,
        mode,
        timeLimitMinutes: mode === "EXAM" ? timeLimitMinutes : null,
        questionCount,
        topicId: topicId || null,
        categoryId: categoryId || null,
        difficulty: difficulty || null,
        onlyFavorites,
        onlyIncorrect,
        dueForReviewOnly: isDueMode,
        shuffleQuestions,
        shuffleOptions,
        showExplanations: true,
      };

      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create quiz.");
      }

      const quiz = await res.json();
      router.push(`/quiz/${quiz.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleStart} className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border/80 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {isDueMode ? <Repeat className="h-5 w-5 text-emerald-500" /> : <Play className="h-5 w-5 text-primary" />}
            <span>{isDueMode ? "Spaced Repetition Review" : "Configure Your Quiz"}</span>
          </CardTitle>
          <CardDescription>
            {isDueMode
              ? "Review questions scheduled for memory reinforcement today."
              : "Choose practice mode for immediate answer feedback or exam mode for a timed test."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          {/* Quiz Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Quiz Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JavaScript Closures Practice"
              required
            />
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setMode("PRACTICE")}
              className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all space-y-1 select-none",
                mode === "PRACTICE"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-border/80"
              )}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Practice Mode</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Immediate answers, instant explanations, and flexible pacing.
              </p>
            </div>

            <div
              onClick={() => setMode("EXAM")}
              className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all space-y-1 select-none",
                mode === "EXAM"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-border/80"
              )}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Clock className="h-4 w-4" />
                <span>Exam Mode</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Timed simulation, question palette, review flags, final score.
              </p>
            </div>
          </div>

          {/* Question Count & Time Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Number of Questions</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
              />
            </div>

            {mode === "EXAM" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Time Limit (Minutes)</label>
                <Input
                  type="number"
                  min={1}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 15)}
                />
              </div>
            )}
          </div>

          {/* Filtering criteria (unless due mode) */}
          {!isDueMode && (
            <div className="space-y-4 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Question Criteria
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Topic</label>
                  <Select value={topicId} onValueChange={setTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Switches */}
              <div className="flex flex-wrap gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch checked={onlyFavorites} onCheckedChange={setOnlyFavorites} />
                  <span className="text-xs font-medium">Starred only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={onlyIncorrect} onCheckedChange={setOnlyIncorrect} />
                  <span className="text-xs font-medium">Previously incorrect only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
                  <span className="text-xs font-medium">Shuffle order</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={shuffleOptions} onCheckedChange={setShuffleOptions} />
                  <span className="text-xs font-medium">Shuffle options</span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full gap-2 font-bold py-5 mt-4">
            <Play className="h-4 w-4 fill-current" />
            <span>{loading ? "Generating Quiz..." : "Start Quiz Now"}</span>
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
