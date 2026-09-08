"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  HelpCircle,
  CheckCircle2,
  Trophy,
  Flame,
  Clock,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AnalyticsDashboardProps {
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
    topicStats: Array<{ name: string; attempts: number; correct: number; accuracy: number }>;
    strongestTopics: Array<{ name: string; attempts: number; accuracy: number }>;
    weakestTopics: Array<{ name: string; attempts: number; accuracy: number }>;
    recentActivity: Array<{ date: string; accuracy: number; score: number; total: number }>;
    recentQuizzes: any[];
  };
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "#10b981",
  MEDIUM: "#f59e0b",
  HARD: "#ef4444",
};

export function AnalyticsDashboard({ metrics }: AnalyticsDashboardProps) {
  const { overview, difficultyStats, topicStats, strongestTopics, weakestTopics, recentActivity } = metrics;

  const difficultyChartData = Object.entries(difficultyStats).map(([diff, val]) => ({
    name: diff,
    accuracy: val.accuracy,
    attempts: val.total,
  }));

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Library</p>
              <p className="text-2xl font-black text-foreground mt-1">{overview.totalQuestions}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{overview.practicedCount} practiced</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <HelpCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Overall Accuracy</p>
              <p className={`text-2xl font-black mt-1 ${overview.overallAccuracy >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                {overview.overallAccuracy}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{overview.quizAttemptsCount} quizzes taken</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Study Streak</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {overview.currentStreak} <span className="text-xs font-medium text-muted-foreground">days</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Consecutive activity</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Flame className="h-5 w-5 fill-current" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Starred MCQs</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{overview.favoritesCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Marked important</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Performance Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Recent Quiz Accuracy Trend</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Performance across your last 10 quiz attempts.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {recentActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentActivity}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, "Accuracy"]}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No quiz activity recorded yet. Take a quiz to generate data!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Difficulty Accuracy Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart className="h-4 w-4 text-emerald-600" />
              <span>Accuracy by Question Difficulty</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Recall success rates across Easy, Medium, and Hard questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={11} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, "Accuracy"]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {difficultyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[entry.name] || "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Strongest vs Weakest Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strongest */}
        <Card className="shadow-sm border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Strongest Topics (&gt;= 70% Accuracy)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {strongestTopics.length > 0 ? (
              strongestTopics.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t.attempts} attempts</span>
                    <Badge variant="success" className="font-mono">{t.accuracy}%</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Take more quizzes to discover your strengths.</p>
            )}
          </CardContent>
        </Card>

        {/* Weakest */}
        <Card className="shadow-sm border-rose-500/20 bg-rose-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Weak Areas Requiring Revision</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {weakestTopics.length > 0 ? (
              weakestTopics.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t.attempts} attempts</span>
                    <Badge variant="destructive" className="font-mono">{t.accuracy}%</Badge>
                    <Link href={`/quiz/new?topic=${encodeURIComponent(t.name)}`}>
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <Play className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No weak areas detected yet!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
