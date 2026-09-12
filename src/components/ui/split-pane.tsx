"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSplitPercent?: number; // e.g. 75
  minLeftPercent?: number; // e.g. 45
  maxLeftPercent?: number; // e.g. 85
  className?: string;
}

export function SplitPane({
  left,
  right,
  defaultSplitPercent = 75,
  minLeftPercent = 45,
  maxLeftPercent = 85,
  className,
}: SplitPaneProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const leftPaneRef = React.useRef<HTMLDivElement>(null);
  const rightPaneRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);

  // Persistent / stateful split percent
  const [splitPercent, setSplitPercent] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ai_split_percent");
        if (saved) {
          const parsed = parseFloat(saved);
          if (parsed >= minLeftPercent && parsed <= maxLeftPercent) return parsed;
        }
      } catch {
        // Ignore localStorage error
      }
    }
    return defaultSplitPercent;
  });

  const [activeTab, setActiveTab] = React.useState<"questions" | "chat">("questions");

  // Apply initial / updated split percent to DOM elements directly for performance
  const applyPercent = React.useCallback((percent: number) => {
    if (leftPaneRef.current && rightPaneRef.current) {
      leftPaneRef.current.style.width = `${percent}%`;
      rightPaneRef.current.style.width = `${100 - percent}%`;
    }
  }, []);

  React.useEffect(() => {
    applyPercent(splitPercent);
  }, [splitPercent, applyPercent]);

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = moveEvent.clientX - rect.left;
      let newPercent = (offsetX / rect.width) * 100;

      // Clamp between min and max bounds
      if (newPercent < minLeftPercent) newPercent = minLeftPercent;
      if (newPercent > maxLeftPercent) newPercent = maxLeftPercent;

      // Update styles directly with rAF for 60fps buttery smooth resizing
      requestAnimationFrame(() => {
        applyPercent(newPercent);
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = upEvent.clientX - rect.left;
      let finalPercent = (offsetX / rect.width) * 100;

      if (finalPercent < minLeftPercent) finalPercent = minLeftPercent;
      if (finalPercent > maxLeftPercent) finalPercent = maxLeftPercent;

      setSplitPercent(finalPercent);
      try {
        localStorage.setItem("ai_split_percent", finalPercent.toFixed(1));
      } catch {
        // Ignore
      }

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Double click resets to default split
  const handleDoubleClick = () => {
    setSplitPercent(defaultSplitPercent);
    applyPercent(defaultSplitPercent);
    try {
      localStorage.setItem("ai_split_percent", defaultSplitPercent.toString());
    } catch {
      // Ignore
    }
  };

  return (
    <div className={cn("w-full flex flex-col", className)}>
      {/* Mobile / Tablet Tab Switcher (< 1024px) */}
      <div className="flex lg:hidden items-center border rounded-xl p-1 mb-4 bg-muted/30">
        <button
          type="button"
          onClick={() => setActiveTab("questions")}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
            activeTab === "questions"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Generated Questions (75% View)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
            activeTab === "chat"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          AI Chat & Copilot (25% View)
        </button>
      </div>

      {/* Mobile view rendering */}
      <div className="block lg:hidden w-full">
        {activeTab === "questions" ? left : right}
      </div>

      {/* Desktop Draggable Two-Column Split Pane (>= 1024px) */}
      <div
        ref={containerRef}
        className="hidden lg:flex w-full items-stretch min-h-[750px] relative select-none"
      >
        {/* Left Pane (75% Default) */}
        <div
          ref={leftPaneRef}
          style={{ width: `${splitPercent}%` }}
          className="pr-2.5 overflow-y-auto shrink-0 transition-none select-text"
        >
          {left}
        </div>

        {/* Draggable Divider Handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onDoubleClick={handleDoubleClick}
          title="Drag to resize panels (Double click to reset to 75% / 25%)"
          className="group relative flex items-center justify-center w-3 cursor-col-resize shrink-0 select-none z-20 hover:w-3.5 transition-all"
        >
          {/* Vertical Divider Line */}
          <div className="w-[2px] h-full bg-border group-hover:bg-purple-500/70 group-active:bg-purple-600 transition-colors" />

          {/* Grab Handle Pill Icon */}
          <div className="absolute top-1/2 -translate-y-1/2 h-8 w-4 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground group-hover:text-purple-600 group-hover:border-purple-500/50 group-active:scale-110 transition-all">
            <GripVertical className="h-3 w-3" />
          </div>
        </div>

        {/* Right Pane (25% Default) */}
        <div
          ref={rightPaneRef}
          style={{ width: `${100 - splitPercent}%` }}
          className="pl-2.5 overflow-y-auto shrink-0 transition-none select-text"
        >
          {right}
        </div>
      </div>
    </div>
  );
}
