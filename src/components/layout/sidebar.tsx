"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  Play,
  History,
  Layers,
  Sparkles,
  BarChart3,
  Settings,
  PlusCircle,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Questions", href: "/questions", icon: HelpCircle },
  { label: "New Quiz", href: "/quiz/new", icon: Play },
  { label: "Quiz History", href: "/quiz", icon: History },
  { label: "Topics", href: "/topics", icon: Layers },
  { label: "AI Generator", href: "/ai", icon: Sparkles, badge: "AI" },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [optimisticHref, setOptimisticHref] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  return (
    <aside
      className={cn(
        "flex flex-col w-64 border-r bg-card/50 backdrop-blur-sm h-[calc(100vh-3.5rem)] sticky top-14 p-4 justify-between",
        className
      )}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Link href="/questions/new" prefetch={true} className="block w-full">
            <Button className="w-full justify-start gap-2 shadow-sm font-semibold" size="sm">
              <PlusCircle className="h-4 w-4 text-primary-foreground" />
              <span>Add Question</span>
            </Button>
          </Link>
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const currentActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isActive = optimisticHref ? optimisticHref === item.href : currentActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setOptimisticHref(item.href)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground active:scale-98",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-2">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Repeat className="h-3.5 w-3.5 text-emerald-500" />
          <span>Spaced Repetition</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Daily revision intervals active based on the SuperMemo SM-2 algorithm.
        </p>
        <Link href="/quiz/new?due=true">
          <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-1">
            Revise Due Today
          </Button>
        </Link>
      </div>
    </aside>
  );
}
