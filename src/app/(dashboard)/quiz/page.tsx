import * as React from "react";
import Link from "next/link";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";
import { Play, Clock, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";

export default async function QuizHistoryPage() {
  const user = await requireAuth();
  const attempts = await QuizService.getAttempts(user.id, 50);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Quiz History & Attempts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Review past test sessions, accuracy scores, and performance trends.
          </p>
        </div>

        <Link href="/quiz/new">
          <Button className="gap-2 font-bold shadow-sm">
            <Play className="h-4 w-4 fill-current" />
            <span>Start New Quiz</span>
          </Button>
        </Link>
      </div>

      {attempts.length === 0 ? (
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
          {attempts.map((att: any) => (
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
                    <span>{formatTime(att.timeTakenSeconds)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className={`text-xl font-black ${att.accuracy >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                      {att.accuracy}%
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {att.score} / {att.totalQuestions} correct
                    </p>
                  </div>

                  <Link href={`/quiz/${att.quizId || att.id}/results?attemptId=${att.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                      <span>View Results</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
