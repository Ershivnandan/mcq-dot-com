"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  Play,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Questions", href: "/questions", icon: HelpCircle },
  { label: "Quiz", href: "/quiz/new", icon: Play },
  { label: "AI", href: "/ai", icon: Sparkles },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const [optimisticHref, setOptimisticHref] = React.useState<string | null>(null);

  // Sync optimistic tab whenever pathname changes
  React.useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden px-2 shadow-lg">
      {mobileItems.map((item) => {
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
              "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all px-2.5 py-1 rounded-xl active:scale-95",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110 text-primary" : "text-muted-foreground")} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
