"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Sparkles, Clock, Shuffle, CheckCircle, Repeat, HelpCircle, Calendar, Loader2 } from "lucide-react";
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
import { QuizCreatorProps, QuizMode } from "@/typings";

export function QuizCreator({ topics, categories }: QuizCreatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDueMode = searchParams.get("due") === "true";

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState(
    isDueMode ? "Daily Spaced Repetition Quiz" : "Practice Quiz"
  );
  const [mode, setMode] = React.useState<QuizMode>(QuizMode.PRACTICE);
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

  // Date Range / Month Filtering on questionDate
  const [dateFilterMode, setDateFilterMode] = React.useState<"ALL" | "MONTH" | "RANGE">("ALL");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  // Live Available Count
  const [availableCount, setAvailableCount] = React.useState<number | null>(null);
  const [countingQuestions, setCountingQuestions] = React.useState(false);

  // Fetch available count whenever filters change
  React.useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      setCountingQuestions(true);
      try {
        const params = new URLSearchParams();
        if (topicId && topicId !== "all") params.set("topicId", topicId);
        if (difficulty) params.set("difficulty", difficulty);
        if (onlyFavorites) params.set("onlyFavorites", "true");
        if (onlyIncorrect) params.set("onlyIncorrect", "true");
        if (isDueMode) params.set("dueForReviewOnly", "true");
        if (dateFilterMode !== "ALL") {
          if (dateFrom) params.set("dateFrom", dateFrom);
          if (dateTo) params.set("dateTo", dateTo);
        }

        const res = await fetch(`/api/quizzes/count?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setAvailableCount(data.count);
            // Adjust question count to available count if needed
            if (data.count === 0) {
              setQuestionCount(0);
            } else if (questionCount === 0 || questionCount > data.count) {
              setQuestionCount(Math.min(20, data.count));
            }
          }
        }
      } catch (err) {
        console.error("Failed to count questions", err);
      } finally {
        if (active) setCountingQuestions(false);
      }
    };

    fetchCount();
    return () => {
      active = false;
    };
  }, [topicId, difficulty, onlyFavorites, onlyIncorrect, isDueMode, dateFilterMode, dateFrom, dateTo]);

  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    if (!monthStr) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const [yStr, mStr] = monthStr.split("-");
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    if (year && month) {
      const fromStr = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const toStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      setDateFrom(fromStr);
      setDateTo(toStr);

      const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" });
      if (title === "Practice Quiz" || title === "Exam Quiz" || title.endsWith("Quiz")) {
        setTitle(`${monthName} ${year} Quiz`);
      }
    }
  };

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
        dateFrom: dateFilterMode !== "ALL" && dateFrom ? dateFrom : null,
        dateTo: dateFilterMode !== "ALL" && dateTo ? dateTo : null,
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
              onClick={() => setMode(QuizMode.PRACTICE)}
              className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all space-y-1 select-none",
                mode === QuizMode.PRACTICE
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
              onClick={() => setMode(QuizMode.EXAM)}
              className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all space-y-1 select-none",
                mode === QuizMode.EXAM
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

          {/* Question Criteria (unless due mode) */}
          {!isDueMode && (
            <div className="space-y-4 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Question Criteria
              </p>

              {/* Topic Selector */}
              <div className="grid grid-cols-1 gap-3">
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

              {/* Date Filter (questionDate) */}
              <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Filter by Question Date</span>
                </div>

                {/* Filter Mode Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={dateFilterMode === "ALL" ? "default" : "outline"}
                    onClick={() => {
                      setDateFilterMode("ALL");
                      setDateFrom("");
                      setDateTo("");
                      setSelectedMonth("");
                    }}
                    className="text-xs h-8"
                  >
                    All Time
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={dateFilterMode === "MONTH" ? "default" : "outline"}
                    onClick={() => setDateFilterMode("MONTH")}
                    className="text-xs h-8"
                  >
                    Specific Month
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={dateFilterMode === "RANGE" ? "default" : "outline"}
                    onClick={() => setDateFilterMode("RANGE")}
                    className="text-xs h-8"
                  >
                    Custom Range
                  </Button>
                </div>

                {/* Specific Month Picker */}
                {dateFilterMode === "MONTH" && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Select Month & Year
                    </label>
                    <Input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      className="bg-background"
                      required={dateFilterMode === "MONTH"}
                    />
                    {dateFrom && dateTo && (
                      <p className="text-[11px] text-emerald-600 font-medium">
                        ✓ Range: {dateFrom} to {dateTo}
                      </p>
                    )}
                  </div>
                )}

                {/* Custom Date Range Pickers */}
                {dateFilterMode === "RANGE" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">From Date</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="bg-background"
                        required={dateFilterMode === "RANGE"}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">To Date</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="bg-background"
                        required={dateFilterMode === "RANGE"}
                      />
                    </div>
                  </div>
                )}
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

          {/* Number of Questions & Available Count (Placed after Topic & Date Range) */}
          <div className="space-y-4 pt-4 border-t">
            {/* Live Available Count Display */}
            <div className="rounded-xl border bg-muted/40 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {countingQuestions ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : availableCount === 0 ? (
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                )}
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {countingQuestions ? (
                      "Counting matching questions..."
                    ) : availableCount === 0 ? (
                      "0 Questions Available"
                    ) : (
                      `${availableCount ?? "..."} Questions Available`
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {availableCount === 0
                      ? "No questions match your current filters. Try adjusting topic or date range."
                      : `You can select up to ${Math.min(2000, availableCount || 2000)} questions from this criteria.`}
                  </p>
                </div>
              </div>

              {availableCount !== null && availableCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestionCount(Math.min(2000, availableCount))}
                  className="text-xs h-7 font-semibold"
                >
                  Select All ({Math.min(2000, availableCount)})
                </Button>
              )}
            </div>

            {/* Question Count & Time Limit Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Number of Questions to Attempt
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Max: {availableCount !== null ? Math.min(2000, availableCount) : 2000}
                  </span>
                </div>
                <Input
                  type="number"
                  min={availableCount === 0 ? 0 : 1}
                  max={availableCount !== null ? Math.min(2000, availableCount) : 2000}
                  value={questionCount}
                  disabled={availableCount === 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const maxLimit = availableCount !== null ? Math.min(2000, availableCount) : 2000;
                    setQuestionCount(Math.min(maxLimit, Math.max(1, val)));
                  }}
                />

                {/* Quick count preset chips */}
                {availableCount !== null && availableCount > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[10, 20, 50, 100, 250, 500, 1000]
                      .filter((num) => num < availableCount)
                      .map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuestionCount(num)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer",
                            questionCount === num
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/40 hover:bg-muted text-muted-foreground"
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => setQuestionCount(Math.min(2000, availableCount))}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer",
                        questionCount === Math.min(2000, availableCount)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground"
                      )}
                    >
                      All ({Math.min(2000, availableCount)})
                    </button>
                  </div>
                )}
              </div>

              {mode === "EXAM" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Time Limit (Minutes)
                  </label>
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
          </div>

          <Button
            type="submit"
            disabled={loading || countingQuestions || availableCount === 0 || questionCount < 1}
            className="w-full gap-2 font-bold py-5 mt-4"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>
              {loading
                ? "Generating Quiz..."
                : availableCount === 0
                ? "No Questions Match Selected Criteria"
                : `Start Quiz (${questionCount} Questions)`}
            </span>
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
