import * as React from "react";
import Link from "next/link";
import { requireAuth } from "@/server/auth/session";
import { AnalyticsService } from "@/server/services/analytics.service";
import { SpacedRepetitionService } from "@/server/services/spaced-repetition.service";
import { QuestionService } from "@/server/services/question.service";
import {
  PlusCircle,
  Play,
  Sparkles,
  HelpCircle,
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  Repeat,
  AlertTriangle,
  FolderTree,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/questions/question-card";
import { formatDate } from "@/lib/utils";

import dynamic from "next/dynamic";
import { DashboardChartsSkeleton } from "@/components/skeletons/dashboard/skeleton";

const DashboardCharts = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => <DashboardChartsSkeleton />,
  }
);

export default async function DashboardPage() {
  const user = await requireAuth();

  const [metrics, dueQuestions, recentQuestionsData] = await Promise.all([
    AnalyticsService.getDashboardMetrics(user.id),
    SpacedRepetitionService.getQuestionsDueToday(user.id, 4),
    QuestionService.getQuestions(user.id, { page: 1, limit: 4, sortBy: "createdAt", sortOrder: "desc" }),
  ]);

  const recentQuestions = recentQuestionsData.questions;
  const { overview, weakestTopics, recentQuizzes } = metrics;

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent p-6 rounded-2xl border border-primary/20">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Welcome back, {user.name || "Learner"}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Ready to practice? You have{" "}
            <span className="font-bold text-foreground">{dueQuestions.length} questions</span> due for
            spaced repetition review today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/quiz/new">
            <Button className="gap-2 font-bold shadow">
              <Play className="h-4 w-4 fill-current" />
              <span>Start Quiz</span>
            </Button>
          </Link>
          <Link href="/ai">
            <Button variant="secondary" className="gap-2 font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 border border-purple-500/20">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>AI Generator</span>
            </Button>
          </Link>
          <Link href="/questions/new">
            <Button variant="outline" className="gap-1.5">
              <PlusCircle className="h-4 w-4 text-emerald-500" />
              <span>Add Question</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Question Library
              </p>
              <p className="text-2xl font-black text-foreground mt-1">{overview.totalQuestions}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{overview.favoritesCount} starred</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <HelpCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Accuracy
              </p>
              <p className={`text-2xl font-black mt-1 ${overview.overallAccuracy >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                {overview.overallAccuracy}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{overview.quizAttemptsCount} attempts</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Study Streak
              </p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {overview.currentStreak} <span className="text-xs font-medium text-muted-foreground">days</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Consecutive active days</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Flame className="h-5 w-5 fill-current" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Due For Review
              </p>
              <p className="text-2xl font-black text-purple-600 mt-1">{dueQuestions.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">SM-2 interval schedule</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Repeat className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Questions Analytics Charts */}
      <DashboardCharts metrics={metrics} />

      {/* Spaced Repetition Due Today Widget */}
      {dueQuestions.length > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                <span>Questions Due For Revision Today</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Reinforce these concepts right now to strengthen retention before memory decays.
              </CardDescription>
            </div>
            <Link href="/quiz/new?due=true">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5">
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Practice Due Now</span>
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dueQuestions.map((q: any) => (
                <div key={q.id} className="p-3.5 rounded-xl border bg-card text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{q.topic?.name || "General"}</Badge>
                    <Badge variant="outline">{q.difficulty}</Badge>
                  </div>
                  <p className="font-semibold text-foreground line-clamp-2">{q.questionText}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Section: Recent Quizzes & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Recent Quizzes</span>
            </CardTitle>
            <Link href="/quiz" className="text-xs text-primary hover:underline font-semibold">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentQuizzes.length > 0 ? (
              recentQuizzes.map((q: any) => (
                <Link
                  key={q.id}
                  href={`/quiz/${q.quizId || q.id}/results?attemptId=${q.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{q.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(q.completedAt)} • {q.mode}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${q.accuracy >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                      {q.accuracy}%
                    </p>
                    <p className="text-[11px] text-muted-foreground">{q.score}/{q.totalQuestions}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No quizzes completed yet.{" "}
                <Link href="/quiz/new" className="text-primary font-bold hover:underline">
                  Take your first quiz!
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weak Areas Needing Review */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Priority Revision Areas</span>
            </CardTitle>
            <Link href="/analytics" className="text-xs text-primary hover:underline font-semibold">
              Analytics
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakestTopics.length > 0 ? (
              weakestTopics.map((t: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.attempts} attempts recorded</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="font-mono text-xs">{t.accuracy}%</Badge>
                    <Link href={`/quiz/new?topic=${encodeURIComponent(t.name)}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Practice
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No weak areas detected! Take more quizzes to track topic mastery.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Added Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Recently Added Questions</h2>
            <p className="text-xs text-muted-foreground">Latest additions to your study library.</p>
          </div>
          <Link href="/questions">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold">
              <span>View Library</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentQuestions.map((q: any) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      </div>
    </div>
  );
}
