import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles, CheckCircle2, Trophy, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 border-b max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2 font-black text-xl tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-black shadow">
            M
          </span>
          <span>MCQ Quiz Manager</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="font-bold">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Learning Platform with BYOK</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
            Master Any Exam with Intelligent <span className="text-primary">MCQ Practice</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Manage your question library with accurate timestamps, generate schema-validated questions using your own Gemini/OpenAI keys, practice with instant feedback, and retain knowledge through spaced repetition.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 font-bold px-8 shadow-md">
                <span>Start Practicing for Free</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-6">
                Sign In to Account
              </Button>
            </Link>
          </div>

          {/* Features highlight pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 text-left">
            <div className="rounded-xl border p-4 bg-card/50 shadow-sm space-y-1">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-bold text-foreground">Library & Search</p>
              <p className="text-xs text-muted-foreground">Filter by topic, date, and difficulty.</p>
            </div>
            <div className="rounded-xl border p-4 bg-card/50 shadow-sm space-y-1">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-bold text-foreground">Practice & Exam</p>
              <p className="text-xs text-muted-foreground">Immediate explanations or timed tests.</p>
            </div>
            <div className="rounded-xl border p-4 bg-card/50 shadow-sm space-y-1">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <p className="text-sm font-bold text-foreground">BYOK AI Generator</p>
              <p className="text-xs text-muted-foreground">Your own keys with draft review workflow.</p>
            </div>
            <div className="rounded-xl border p-4 bg-card/50 shadow-sm space-y-1">
              <Trophy className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-bold text-foreground">Spaced Repetition</p>
              <p className="text-xs text-muted-foreground">SM-2 memory interval calculations.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t text-center text-xs text-muted-foreground">
        MCQ Quiz Manager — Full-Stack Production Rebuild
      </footer>
    </div>
  );
}
