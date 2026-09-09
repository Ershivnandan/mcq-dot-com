"use client";

import * as React from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  LayoutDashboard,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatTime } from "@/lib/utils";
import { DetailedAnswer, QuizResultsProps } from "@/typings";

export function QuizResults({ attempt, answers = [] }: QuizResultsProps) {
  React.useEffect(() => {
    if (attempt.accuracy >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore in environments without window/canvas
      }
    }
  }, [attempt.accuracy]);

  const [activeFilter, setActiveFilter] = React.useState<"all" | "correct" | "incorrect" | "unanswered">("all");

  const filteredAnswers = answers.filter((ans) => {
    if (activeFilter === "correct") return ans.isCorrect;
    if (activeFilter === "incorrect") return !ans.isCorrect && ans.selectedOptionId !== null;
    if (activeFilter === "unanswered") return ans.selectedOptionId === null;
    return true;
  });

  const timeTaken = attempt.timeTakenSeconds ?? attempt.timeSpentSeconds ?? 0;
  const unansweredCount = attempt.unansweredCount ?? attempt.skippedCount ?? 0;

  const avgTime =
    attempt.totalQuestions > 0
      ? Math.round(timeTaken / attempt.totalQuestions)
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Banner / Score Gauge */}
      <Card className="border-border/80 shadow-lg overflow-hidden bg-gradient-to-b from-card to-background">
        <CardContent className="p-8 text-center space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-2 shadow-inner">
            <Trophy className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {attempt.title} Results
            </h1>
            <p className="text-sm text-muted-foreground">
              {attempt.accuracy >= 80
                ? "Outstanding performance! You've demonstrated excellent mastery."
                : attempt.accuracy >= 60
                ? "Good effort! Review the explanations below to strengthen weak areas."
                : "Keep practicing! Regular revision will dramatically improve recall."}
            </p>
          </div>

          {/* Metric KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
            <div className="rounded-xl border bg-card p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Score</p>
              <p className="text-2xl font-black text-foreground">
                {attempt.score} <span className="text-sm font-medium text-muted-foreground">/ {attempt.totalQuestions}</span>
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Accuracy</p>
              <p className={`text-2xl font-black ${attempt.accuracy >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                {attempt.accuracy}%
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Time</p>
              <p className="text-2xl font-black text-foreground">{formatTime(timeTaken)}</p>
            </div>

            <div className="rounded-xl border bg-card p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Avg / Question</p>
              <p className="text-2xl font-black text-foreground">{avgTime}s</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/quiz/new">
              <Button className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" />
                <span>Take Another Quiz</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Go to Dashboard</span>
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="ghost" className="gap-2">
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Answer Review Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">Detailed Question Review</h2>

          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <Button
              variant={activeFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className="h-7 text-xs"
            >
              All ({answers.length})
            </Button>
            <Button
              variant={activeFilter === "correct" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("correct")}
              className="h-7 text-xs text-emerald-600"
            >
              Correct ({attempt.correctCount})
            </Button>
            <Button
              variant={activeFilter === "incorrect" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("incorrect")}
              className="h-7 text-xs text-rose-600"
            >
              Incorrect ({attempt.incorrectCount})
            </Button>
            {unansweredCount > 0 && (
              <Button
                variant={activeFilter === "unanswered" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("unanswered")}
                className="h-7 text-xs text-muted-foreground"
              >
                Unanswered ({unansweredCount})
              </Button>
            )}
          </div>
        </div>

        {/* Answers List */}
        <div className="space-y-4">
          {filteredAnswers.map((ans, idx) => (
            <Card
              key={ans.questionId}
              className={`border-l-4 ${
                ans.isCorrect
                  ? "border-l-emerald-500"
                  : ans.selectedOptionId === null
                  ? "border-l-gray-400"
                  : "border-l-rose-500"
              }`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Q{idx + 1}</Badge>
                    <Badge variant="secondary">{ans.topic}</Badge>
                    <Badge variant="outline" className="text-xs">{ans.difficulty}</Badge>
                  </div>
                  {ans.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Correct</span>
                    </span>
                  ) : ans.selectedOptionId === null ? (
                    <span className="text-xs font-semibold text-muted-foreground">Unanswered</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-600">
                      <XCircle className="h-4 w-4" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                <p className="text-base font-semibold text-foreground">{ans.questionText}</p>

                {/* Options representation */}
                <div className="space-y-1.5 pt-1">
                  {ans.options.map((opt, i) => {
                    const isChosen = ans.selectedOptionId === opt.id;
                    const isRight = opt.isCorrect;

                    let bg = "bg-muted/20 border-border/60 text-muted-foreground";
                    if (isRight) {
                      bg = "bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold";
                    } else if (isChosen && !isRight) {
                      bg = "bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300 line-through";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${bg}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs">{String.fromCharCode(65 + i)}.</span>
                          <span>{opt.optionText}</span>
                        </div>
                        {isRight && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {isChosen && !isRight && <XCircle className="h-4 w-4 text-rose-600" />}
                      </div>
                    );
                  })}
                </div>

                {ans.explanation && (
                  <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed space-y-1 border border-border/50">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span>Explanation</span>
                    </div>
                    <p className="text-muted-foreground">{ans.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
