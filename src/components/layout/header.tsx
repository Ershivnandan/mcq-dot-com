"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  PlusCircle,
  Sparkles,
  User,
  LogOut,
  Settings,
  Menu,
  Smartphone,
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
import { HeaderProps } from "@/typings";

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
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 gap-4">
      {/* Left: Brand Logo & Navigation Toggle */}
      <div className="flex items-center gap-3 shrink-0">
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
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <Image
            src="/logo.png"
            alt="MCQ Quiz Manager"
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg object-contain shadow-sm"
          />
          <span className="hidden sm:inline-block">MCQ Quiz Manager</span>
        </Link>
      </div>

      {/* Center: Search Bar with proper responsive width */}
      <div className="flex-1 flex justify-center max-w-xl mx-2 sm:mx-4">
        <button
          type="button"
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
            document.dispatchEvent(event);
          }}
          className="hidden sm:flex items-center gap-2.5 rounded-lg border border-input/60 bg-muted/40 hover:bg-muted/70 px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all w-full max-w-sm lg:max-w-md justify-between shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Search questions, topics, exams...</span>
          </span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs shrink-0">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile search trigger icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
            document.dispatchEvent(event);
          }}
          className="sm:hidden h-8 w-8 text-muted-foreground"
          title="Search (⌘K)"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search questions</span>
        </Button>

        <Link href="/questions/new">
          <Button size="sm" variant="outline" className="hidden sm:inline-flex gap-1.5 text-xs h-8">
            <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span>New</span>
          </Button>
        </Link>

        <Link href="/ai">
          <Button size="sm" variant="default" className="hidden sm:inline-flex gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs h-8">
            <Sparkles className="h-3.5 w-3.5" />
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
            <DropdownMenuItem
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-pwa-install"));
                }
              }}
              className="cursor-pointer font-medium text-primary focus:text-primary"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              <span>Install App (PWA)</span>
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
