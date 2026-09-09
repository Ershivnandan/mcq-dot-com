"use client";

import * as React from "react";
import { Star, Archive, Trash2, FolderPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onAction: (action: "favorite" | "archive" | "delete") => void;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onAction,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border bg-background/95 px-5 py-2.5 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-in fade-in slide-in-from-bottom-5">
      <span className="text-xs font-semibold text-foreground whitespace-nowrap">
        {selectedCount} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAction("favorite")}
        className="h-8 gap-1 text-xs"
      >
        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
        <span className="hidden sm:inline">Star</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAction("archive")}
        className="h-8 gap-1 text-xs"
      >
        <Archive className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Archive</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (confirm(`Are you sure you want to delete ${selectedCount} questions?`)) {
            onAction("delete");
          }
        }}
        className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Delete</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        className="h-7 w-7 rounded-full text-muted-foreground ml-1"
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Clear selection</span>
      </Button>
    </div>
  );
}
