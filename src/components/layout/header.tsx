"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  PlusCircle,
  Sparkles,
  User,
  LogOut,
  Settings,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuToggle?: () => void;
  user?: { name?: string | null; email?: string } | null;
}

export function Header({ onMenuToggle, user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="md:hidden h-9 w-9"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-black shadow">
            M
          </span>
          <span className="hidden sm:inline-block">MCQ Quiz Manager</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Command palette search trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
            document.dispatchEvent(event);
          }}
          className="hidden md:flex items-center gap-2 rounded-md border border-input bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors w-48 justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            <span>Search questions...</span>
          </span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <Link href="/questions/new">
          <Button size="sm" variant="outline" className="hidden sm:inline-flex gap-1.5">
            <PlusCircle className="h-4 w-4 text-emerald-500" />
            <span>New</span>
          </Button>
        </Link>

        <Link href="/ai">
          <Button size="sm" variant="default" className="hidden sm:inline-flex gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
            <Sparkles className="h-4 w-4" />
            <span>AI Gen</span>
          </Button>
        </Link>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-primary/10 text-primary">
              <User className="h-4 w-4" />
              <span className="sr-only">User profile</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">{user?.name || "Learner"}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/profile")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings/ai")} className="cursor-pointer">
              <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
              <span>AI Provider & Keys</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>General Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
