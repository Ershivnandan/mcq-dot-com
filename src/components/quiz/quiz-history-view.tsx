"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Clock,
  RotateCcw,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Trash2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate, formatTime } from "@/lib/utils";

interface QuizHistoryViewProps {
  initialAttempts: any[];
  initialSavedQuizzes: any[];
}

export function QuizHistoryView({ initialAttempts, initialSavedQuizzes }: QuizHistoryViewProps) {
  const router = useRouter();
  const [savedQuizzes, setSavedQuizzes] = React.useState(initialSavedQuizzes);
  const [unsavingId, setUnsavingId] = React.useState<string | null>(null);

  const handleUnsave = async (quizId: string) => {
    if (unsavingId) return;
    setUnsavingId(quizId);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved: false }),
      });
      if (res.ok) {
        setSavedQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      }
    } catch (err) {
      console.error("Failed to unsave quiz", err);
    } finally {
      setUnsavingId(null);
    }
  };

  return (
    <Tabs defaultValue="attempts" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <TabsList className="bg-muted/70 p-1">
          <TabsTrigger value="attempts" className="gap-2 text-xs sm:text-sm font-semibold">
            <Clock className="h-4 w-4" />
            <span>Recent Attempts</span>
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">
              {initialAttempts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2 text-xs sm:text-sm font-semibold">
            <Bookmark className="h-4 w-4 text-primary" />
            <span>Saved Quizzes</span>
            <span className="ml-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
              {savedQuizzes.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <Link href="/quiz/new">
          <Button className="gap-2 font-bold shadow-sm">
            <Play className="h-4 w-4 fill-current" />
            <span>Start New Quiz</span>
          </Button>
        </Link>
      </div>

      {/* Tab: Recent Attempts */}
      <TabsContent value="attempts" className="space-y-4">
        {initialAttempts.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base">No Quizzes Taken Yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Test your recall, practice under exam pressure, and build your mastery streak.
                </p>
              </div>
              <Link href="/quiz/new" className="inline-block pt-2">
                <Button className="gap-2 font-bold">
                  <span>Start Your First Quiz</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {initialAttempts.map((att: any) => {
              const quizId = att.quizId || att.id;
              return (
                <Card key={att.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">{att.title}</span>
                        <Badge variant={att.mode === "EXAM" ? "destructive" : "secondary"}>
                          {att.mode}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{formatDate(att.completedAt)}</span>
                        <span>•</span>
                        <span>{att.totalQuestions} questions</span>
                        <span>•</span>
                        <span>{formatTime(att.timeTakenSeconds || att.timeSpentSeconds || 0)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p
                          className={`text-xl font-black ${
                            att.accuracy >= 70 ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {att.accuracy}%
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {att.score} / {att.totalQuestions} correct
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 1-Click Retake Quiz Button */}
                        <Link href={`/quiz/${quizId}`}>
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Retake</span>
                          </Button>
                        </Link>

                        {/* View Detailed Results */}
                        <Link href={`/quiz/${quizId}/results?attemptId=${att.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                            <span>Results</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* Tab: Saved Quizzes */}
      <TabsContent value="saved" className="space-y-4">
        {savedQuizzes.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Bookmark className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base">No Saved Quizzes Yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When you finish any quiz, click "Save Quiz" on the results screen to keep it in this library for easy future retakes.
                </p>
              </div>
              <Link href="/quiz/new" className="inline-block pt-2">
                <Button className="gap-2 font-bold">
                  <span>Create a Quiz</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {savedQuizzes.map((quiz: any) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow border-border/80">
                <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-primary fill-primary/20" />
                      <span className="font-bold text-base text-foreground">{quiz.title}</span>
                      <Badge variant={quiz.mode === "EXAM" ? "destructive" : "secondary"}>
                        {quiz.mode}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{quiz.totalQuestions || quiz.questionIds?.length || 0} questions</span>
                      <span>•</span>
                      <span>Saved on {formatDate(quiz.savedAt || quiz.createdAt)}</span>

                      {(quiz.dateFrom || quiz.dateTo) && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {quiz.dateFrom && quiz.dateTo
                                ? `${quiz.dateFrom} to ${quiz.dateTo}`
                                : quiz.dateFrom
                                ? `From ${quiz.dateFrom}`
                                : `To ${quiz.dateTo}`}
                            </span>
                          </span>
                        </>
                      )}

                      {quiz.attemptsCount !== undefined && quiz.attemptsCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">
                            {quiz.attemptsCount} {quiz.attemptsCount === 1 ? "attempt" : "attempts"} (Best: {quiz.bestAccuracy}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Retake / Start Quiz */}
                    <Link href={`/quiz/${quiz.id}`}>
                      <Button className="gap-2 font-bold shadow-xs">
                        <RotateCcw className="h-4 w-4" />
                        <span>{quiz.attemptsCount > 0 ? "Retake Quiz" : "Start Quiz"}</span>
                      </Button>
                    </Link>

                    {/* Unsave button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsave(quiz.id)}
                      disabled={unsavingId === quiz.id}
                      className="text-muted-foreground hover:text-destructive h-9 px-2.5"
                      title="Remove from Saved Quizzes"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
