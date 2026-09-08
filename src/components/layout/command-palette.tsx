"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  PlusCircle,
  Play,
  Sparkles,
  BarChart3,
  FolderTree,
  Settings,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command } from "cmdk";
import { useTheme } from "./theme-provider";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-xl">
        <Command className="[&_[cmdk-root]]:w-full [&_[cmdk-input]]:w-full [&_[cmdk-input]]:p-4 [&_[cmdk-input]]:text-base [&_[cmdk-input]]:border-none [&_[cmdk-input]]:bg-transparent [&_[cmdk-input]]:outline-none [&_[cmdk-input]]:placeholder:text-muted-foreground border-b">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input placeholder="Type a command or search..." className="w-full py-3 text-sm bg-transparent outline-none" />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/questions"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Search className="h-4 w-4 text-blue-500" />
                <span>Search Questions</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/questions/new"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <PlusCircle className="h-4 w-4 text-emerald-500" />
                <span>Create New Question</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/quiz/new"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Play className="h-4 w-4 text-indigo-500" />
                <span>Start Quiz</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/ai"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>AI Question Generator</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/collections"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <FolderTree className="h-4 w-4 text-amber-500" />
                <span>Collections</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/analytics"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <BarChart3 className="h-4 w-4 text-cyan-500" />
                <span>Analytics Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Theme" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              <Command.Item
                onSelect={() => runCommand(() => setTheme("light"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Switch to Light Theme</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setTheme("dark"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Moon className="h-4 w-4 text-blue-400" />
                <span>Switch to Dark Theme</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
