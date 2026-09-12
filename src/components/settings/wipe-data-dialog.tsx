"use client";

import * as React from "react";
import {
  AlertTriangle,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { QUESTIONS_QUERY_KEY } from "@/hooks/queries/use-questions";
import { TOPICS_QUERY_KEY } from "@/hooks/queries/use-topics";
import { AI_QUERY_KEY } from "@/hooks/queries/use-ai";

interface WipeDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "questions-only" | "full-reset";
  onSuccess?: () => void;
}

export function WipeDataDialog({
  open,
  onOpenChange,
  mode,
  onSuccess,
}: WipeDataDialogProps) {
  const queryClient = useQueryClient();
  const [counts, setCounts] = React.useState<any>(null);
  const [loadingCounts, setLoadingCounts] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState("");
  const [wiping, setWiping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultMessage, setResultMessage] = React.useState<string | null>(null);

  const requiredPhrase = mode === "questions-only" ? "DELETE ALL" : "RESET";
  const isConfirmed = confirmInput.trim() === requiredPhrase;

  // Fetch counts when opened
  React.useEffect(() => {
    if (open) {
      setConfirmInput("");
      setError(null);
      setResultMessage(null);
      setLoadingCounts(true);
      fetch("/api/user/reset")
        .then((r) => r.json())
        .then((data) => setCounts(data))
        .catch(() => setCounts(null))
        .finally(() => setLoadingCounts(false));
    }
  }, [open]);

  const handleExecute = async () => {
    if (!isConfirmed || wiping) return;

    setWiping(true);
    setError(null);
    setResultMessage(null);

    try {
      if (mode === "questions-only") {
        const res = await fetch("/api/questions/delete-all", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmPhrase: requiredPhrase }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete questions.");

        setResultMessage(
          `Successfully wiped ${data.questionsDeleted || 0} questions and associated progress.`
        );
      } else {
        const res = await fetch("/api/user/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmPhrase: requiredPhrase }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to reset account data.");

        setResultMessage(
          `Account wiped clean! Removed ${data.questionsDeleted || 0} questions, ${data.topicsDeleted || 0} topics, and ${data.quizzesDeleted || 0} quizzes.`
        );
      }

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOPICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });

      if (onSuccess) onSuccess();

      // Close modal after brief delay so user can read message
      setTimeout(() => {
        onOpenChange(false);
      }, 1800);
    } catch (err: any) {
      setError(err.message || "An error occurred while wiping data.");
    } finally {
      setWiping(false);
    }
  };

  const isQuestionsOnly = mode === "questions-only";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-destructive/40 sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-destructive">
            {isQuestionsOnly
              ? "Hard Delete All Questions?"
              : "Reset All Account Data?"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {isQuestionsOnly
              ? "This will permanently hard-delete all questions, study progress, and AI drafts from the database. Topics and categories will be kept."
              : "This will permanently wipe ALL questions, quizzes, attempts, topics, categories, tags, and logs so you can start completely fresh. Your account login and session will remain intact."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Warning Box */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-destructive flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Permanent Hard Deletion Warning</p>
              <p className="text-[11px] leading-relaxed text-destructive/90">
                This is a <strong>hard database delete</strong>, not a soft archive.
                Once confirmed, these records are irrevocably erased from MongoDB and cannot be restored.
              </p>
            </div>
          </div>

          {/* Item Statistics */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <span className="font-semibold text-foreground block text-[11px]">
              Data that will be permanently erased:
            </span>
            {loadingCounts ? (
              <div className="flex items-center gap-2 text-muted-foreground py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Calculating stored items...</span>
              </div>
            ) : counts ? (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-bold text-destructive">
                    {counts.questionCount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Progress records:</span>
                  <span className="font-bold text-destructive">
                    {counts.progressCount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">AI Drafts:</span>
                  <span className="font-bold text-destructive">
                    {counts.draftCount?.toLocaleString() || 0}
                  </span>
                </div>
                {!isQuestionsOnly && (
                  <>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Quizzes:</span>
                      <span className="font-bold text-destructive">
                        {counts.quizCount?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Quiz Attempts:</span>
                      <span className="font-bold text-destructive">
                        {counts.attemptCount?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Topics & Categories:</span>
                      <span className="font-bold text-destructive">
                        {((counts.topicCount || 0) + (counts.categoryCount || 0)).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">All questions and study records.</p>
            )}
          </div>

          {/* Type Confirmation Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">
              To confirm, type{" "}
              <span className="font-mono font-bold text-destructive bg-destructive/10 px-1 py-0.5 rounded">
                {requiredPhrase}
              </span>{" "}
              below:
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={`Type "${requiredPhrase}" to unlock`}
              className="h-8 text-xs font-mono"
              disabled={wiping || !!resultMessage}
            />
          </div>

          {/* Success / Error Messages */}
          {resultMessage && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={wiping}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!isConfirmed || wiping || !!resultMessage}
            onClick={handleExecute}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            {wiping ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Hard Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>
                  {isQuestionsOnly ? "Permanently Delete All" : "Reset Account Data"}
                </span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
