"use client";

import * as React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Layers,
  PieChart as PieChartIcon,
  Award,
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DashboardChartsProps {
  metrics: {
    overview: {
      totalQuestions: number;
      practicedCount: number;
      favoritesCount: number;
      archivedCount: number;
      quizAttemptsCount: number;
      overallAccuracy: number;
      currentStreak: number;
    };
    difficultyStats: Record<string, { total: number; correct: number; accuracy: number }>;
    questionsByDifficulty?: Record<string, number>;
    questionsByTopic?: Array<{ name: string; count: number }>;
    masteryBreakdown?: {
      mastered: number;
      learning: number;
      unattempted: number;
      masteredPct: number;
      learningPct: number;
      unattemptedPct: number;
    };
    weeklyActivity?: Array<{ day: string; date: string; attempts: number; questions: number }>;
    recentActivity?: Array<{ date: string; accuracy: number; score: number; total: number }>;
  };
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "#10b981",
  MEDIUM: "#f59e0b",
  HARD: "#ef4444",
};

export function DashboardCharts({ metrics }: DashboardChartsProps) {
  const {
    overview,
    questionsByDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 },
    questionsByTopic = [],
    masteryBreakdown = {
      mastered: 0,
      learning: 0,
      unattempted: overview.totalQuestions,
      masteredPct: 0,
      learningPct: 0,
      unattemptedPct: 100,
    },
    weeklyActivity = [],
    recentActivity = [],
  } = metrics;

  // Toggles for charts
  const [progressChartType, setProgressChartType] = React.useState<"accuracy" | "activity">("accuracy");
  const [distributionChartType, setDistributionChartType] = React.useState<"topic" | "difficulty">("topic");

  // Format difficulty data for donut
  const difficultyDonutData = [
    { name: "Easy", value: questionsByDifficulty.EASY || 0, color: DIFFICULTY_COLORS.EASY },
    { name: "Medium", value: questionsByDifficulty.MEDIUM || 0, color: DIFFICULTY_COLORS.MEDIUM },
    { name: "Hard", value: questionsByDifficulty.HARD || 0, color: DIFFICULTY_COLORS.HARD },
  ].filter((d) => d.value > 0);

  // Fallback if no questions have difficulty
  const hasDifficultyData = difficultyDonutData.length > 0;

  // Has activity data
  const hasQuizHistory = recentActivity.length > 0;
  const hasWeeklyActivity = weeklyActivity.some((w) => w.questions > 0 || w.attempts > 0);

  return (
    <div className="space-y-6">
      {/* Top Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Primary Chart (7 Cols): Progress & Trajectory */}
        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base flex items-center gap-2">
                  {progressChartType === "accuracy" ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>Quiz Performance & Accuracy Trajectory</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span>7-Day Study Volume (Questions Practiced)</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {progressChartType === "accuracy"
                    ? "Tracking test scores and recall accuracy across recent quiz sessions."
                    : "Daily volume of practice questions answered over the last 7 days."}
                </CardDescription>
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center rounded-lg bg-muted/60 p-0.5 text-xs font-semibold border">
                <button
                  type="button"
                  onClick={() => setProgressChartType("accuracy")}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all cursor-pointer",
                    progressChartType === "accuracy"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Accuracy Trend
                </button>
                <button
                  type="button"
                  onClick={() => setProgressChartType("activity")}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all cursor-pointer",
                    progressChartType === "activity"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Weekly Activity
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-64 pt-2">
            {progressChartType === "accuracy" ? (
              hasQuizHistory ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentActivity} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis domain={[0, 100]} fontSize={11} unit="%" stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <Tooltip
                      formatter={(value: any) => [`${value}%`, "Accuracy"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#accuracyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-muted-foreground space-y-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-foreground">No quiz attempts yet</p>
                  <p className="max-w-xs">Complete your first practice quiz to see your accuracy and score trends over time.</p>
                  <Link href="/quiz/new">
                    <Button size="sm" variant="outline" className="text-xs h-7 mt-1">
                      Start Quiz
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="day" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any, name: any) => [val, name === "questions" ? "Questions Practiced" : "Quizzes"]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item ? `${item.day} (${item.date})` : label;
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="questions" name="questions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Right Secondary Chart (5 Cols): Question Library Distribution */}
        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base flex items-center gap-2">
                  {distributionChartType === "topic" ? (
                    <>
                      <Layers className="h-4 w-4 text-purple-600" />
                      <span>Questions by Topic</span>
                    </>
                  ) : (
                    <>
                      <PieChartIcon className="h-4 w-4 text-emerald-600" />
                      <span>Difficulty Breakdown</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {distributionChartType === "topic"
                    ? "Top categories in your question repository."
                    : "Distribution across Easy, Medium, and Hard."}
                </CardDescription>
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center rounded-lg bg-muted/60 p-0.5 text-xs font-semibold border">
                <button
                  type="button"
                  onClick={() => setDistributionChartType("topic")}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all cursor-pointer",
                    distributionChartType === "topic"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  By Topic
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionChartType("difficulty")}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all cursor-pointer",
                    distributionChartType === "difficulty"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Difficulty
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-64 pt-2">
            {distributionChartType === "topic" ? (
              questionsByTopic.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={questionsByTopic}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                    <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={11}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      width={80}
                      tick={{ fill: "hsl(var(--foreground))", fontWeight: 500 }}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} questions`, "Total"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-muted-foreground space-y-2">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Layers className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-foreground">No topic data available</p>
                  <p className="max-w-xs">Assign topics to your questions to visualize your subject coverage.</p>
                </div>
              )
            ) : hasDifficultyData ? (
              <div className="h-full flex items-center justify-between">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {difficultyDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} questions`, name]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list with counts */}
                <div className="w-1/2 space-y-2 pr-2">
                  {difficultyDonutData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-foreground">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono">{item.value}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ({overview.totalQuestions > 0 ? Math.round((item.value / overview.totalQuestions) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-muted-foreground">
                No difficulty records available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spaced Repetition Mastery & Retention Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Mastered */}
        <Card className="border-emerald-500/25 bg-emerald-500/5 shadow-xs">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Mastered Questions</span>
              </div>
              <Badge variant="success" className="font-mono text-[11px]">
                {masteryBreakdown.masteredPct}%
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{masteryBreakdown.mastered}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Interval &ge; 21 days with steady recall
              </p>
            </div>
            <Progress value={masteryBreakdown.masteredPct} className="h-1.5 bg-emerald-500/20 [&>div]:bg-emerald-600" />
          </CardContent>
        </Card>

        {/* Learning */}
        <Card className="border-amber-500/25 bg-amber-500/5 shadow-xs">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                <span>In Learning Cycle</span>
              </div>
              <Badge variant="warning" className="font-mono text-[11px]">
                {masteryBreakdown.learningPct}%
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{masteryBreakdown.learning}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Actively practiced & scheduling intervals
              </p>
            </div>
            <Progress value={masteryBreakdown.learningPct} className="h-1.5 bg-amber-500/20 [&>div]:bg-amber-500" />
          </CardContent>
        </Card>

        {/* Fresh / Unattempted */}
        <Card className="border-blue-500/25 bg-blue-500/5 shadow-xs">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                <HelpCircle className="h-4 w-4" />
                <span>Unpracticed / New</span>
              </div>
              <Badge variant="secondary" className="font-mono text-[11px]">
                {masteryBreakdown.unattemptedPct}%
              </Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-black text-foreground">{masteryBreakdown.unattempted}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Awaiting first practice attempt
                </p>
              </div>
              {masteryBreakdown.unattempted > 0 && (
                <Link href="/quiz/new">
                  <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold gap-1 text-blue-600 hover:text-blue-700">
                    <span>Practice</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
            <Progress value={masteryBreakdown.unattemptedPct} className="h-1.5 bg-blue-500/20 [&>div]:bg-blue-500" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
