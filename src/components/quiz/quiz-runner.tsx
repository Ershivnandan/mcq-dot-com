"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  BookOpen,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatTime } from "@/lib/utils";
import { useAppDispatch } from "@/store";
import {
  startQuiz,
  answerQuestion,
  setCurrentQuestionIndex as setReduxIndex,
  completeQuiz,
} from "@/store/slices/quiz-slice";
import { QuestionItem, QuizRunnerProps } from "@/typings";

export function QuizRunner({ quiz, questions }: QuizRunnerProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [currentIndex, setCurrentIndex] = React.useState(0);
  // Track answers: questionId -> selectedOptionId
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  // Track review marks (Exam Mode)
  const [markedForReview, setMarkedForReview] = React.useState<Record<string, boolean>>({});
  // Time spent per question: questionId -> seconds
  const [timeSpent, setTimeSpent] = React.useState<Record<string, number>>({});
  // Total elapsed time
  const [totalSeconds, setTotalSeconds] = React.useState(0);
  // Confirm submit modal
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const currentQ = questions[currentIndex];
  const isPractice = quiz.mode === "PRACTICE";
  const isExam = quiz.mode === "EXAM";

  // Initialize quiz session in Redux on mount
  React.useEffect(() => {
    dispatch(startQuiz({ quizId: quiz.id }));
  }, [quiz.id, dispatch]);

  // Exam Countdown Timer
  const totalExamSeconds = (quiz.timeLimitMinutes || 15) * 60;
  const [timeRemaining, setTimeRemaining] = React.useState(totalExamSeconds);

  // Timer interval
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTotalSeconds((prev) => prev + 1);
      if (currentQ) {
        setTimeSpent((prev) => ({
          ...prev,
          [currentQ.id]: (prev[currentQ.id] || 0) + 1,
        }));
      }

      if (isExam) {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitQuiz(); // Auto-submit when time expires
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQ?.id, isExam]);

  const handleSelectOption = (optionId: string) => {
    if (isPractice && answers[currentQ.id]) {
      return; // in practice mode, prevent re-selecting once answered
    }
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
    dispatch(answerQuestion({ questionId: currentQ.id, optionId }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const payloadAnswers = questions.map((q) => {
        const selectedOptionId = answers[q.id] || null;
        const selectedOpt = q.options.find((o) => o.id === selectedOptionId);
        return {
          questionId: q.id,
          selectedOptionId,
          isCorrect: Boolean(selectedOpt?.isCorrect),
          timeSpentSeconds: timeSpent[q.id] || 0,
        };
      });

      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quiz.title,
          mode: quiz.mode,
          timeTakenSeconds: totalSeconds,
          answers: payloadAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit attempt.");
      }

      const attempt = await res.json();
      dispatch(completeQuiz());
      router.push(`/quiz/${quiz.id}/results?attemptId=${attempt.id}`);
    } catch (error: any) {
      alert(error.message || "Failed to submit quiz.");
      setSubmitting(false);
    }
  };

  // Practice stats calculation
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q) => {
    const chosen = answers[q.id];
    return q.options.find((o) => o.id === chosen)?.isCorrect;
  }).length;
  const practiceAccuracy = answeredCount > 0 ? ((correctCount / answeredCount) * 100).toFixed(0) : "0";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Banner / Timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/quiz")}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quit</span>
          </Button>
          <div>
            <h2 className="text-sm font-bold text-foreground line-clamp-1">{quiz.title}</h2>
            <p className="text-xs text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        {/* Stats / Timer */}
        <div className="flex items-center gap-3">
          {isPractice && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-600">Correct: {correctCount}</span>
              <span className="text-muted-foreground">Accuracy: {practiceAccuracy}%</span>
            </div>
          )}

          {isExam && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold",
                timeRemaining < 120
                  ? "bg-rose-500/15 text-rose-600 border-rose-500 animate-pulse"
                  : "bg-muted/50 text-foreground"
              )}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}

          <Button
            size="sm"
            variant="default"
            onClick={() => setShowSubmitModal(true)}
            className="gap-1.5 font-bold"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Finish Quiz</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5" />

      {/* Main Layout: Question + Palette (Exam Mode) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Area */}
        <div className={cn("space-y-5", isExam ? "lg:col-span-3" : "lg:col-span-4")}>
          <Card className="border-border/80 shadow-md">
            <CardContent className="p-6 space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold">
                    Q{currentIndex + 1}
                  </Badge>
                  {currentQ?.topic && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      {currentQ.topic.name}
                    </Badge>
                  )}
                  <Badge
                    variant={
                      currentQ?.difficulty === "EASY"
                        ? "success"
                        : currentQ?.difficulty === "HARD"
                        ? "destructive"
                        : "warning"
                    }
                    className="text-[10px]"
                  >
                    {currentQ?.difficulty}
                  </Badge>
                </div>

                {isExam && (
                  <Button
                    variant={markedForReview[currentQ.id] ? "default" : "outline"}
                    size="sm"
                    onClick={toggleMarkForReview}
                    className={cn(
                      "gap-1.5 h-8 text-xs",
                      markedForReview[currentQ.id] && "bg-amber-600 hover:bg-amber-700 text-white"
                    )}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>{markedForReview[currentQ.id] ? "Marked" : "Review Later"}</span>
                  </Button>
                )}
              </div>

              {/* Question Statement */}
              <p className="text-lg font-semibold text-foreground leading-relaxed">
                {currentQ?.questionText}
              </p>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQ?.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  const isAnswered = Boolean(answers[currentQ.id]);

                  let optionClass =
                    "border-border hover:border-primary/50 hover:bg-accent/40 cursor-pointer text-foreground";

                  if (isPractice && isAnswered) {
                    if (opt.isCorrect) {
                      optionClass =
                        "bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold";
                    } else if (isSelected && !opt.isCorrect) {
                      optionClass = "bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300";
                    } else {
                      optionClass = "opacity-40 border-transparent bg-muted/20 cursor-default";
                    }
                  } else if (isExam && isSelected) {
                    optionClass = "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary";
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all select-none",
                        optionClass
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-base">{opt.optionText}</span>
                      </div>

                      {isPractice && isAnswered && opt.isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {isPractice && isAnswered && isSelected && !opt.isCorrect && (
                        <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Practice Mode Solution / Explanation */}
              {isPractice && answers[currentQ.id] && currentQ.explanation && (
                <div className="rounded-xl bg-muted/40 p-4 text-xs leading-relaxed space-y-1.5 border border-border/60 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Explanation & Solution</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{currentQ.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                variant="default"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="gap-1.5 font-bold"
              >
                <span>Next Question</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setShowSubmitModal(true)}
                className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Submit & View Results</span>
              </Button>
            )}
          </div>
        </div>

        {/* Question Palette (Exam Mode) */}
        {isExam && (
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border/80 shadow-sm p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Question Palette
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAns = Boolean(answers[q.id]);
                  const isRev = Boolean(markedForReview[q.id]);
                  const isCur = idx === currentIndex;

                  let color = "bg-muted text-muted-foreground hover:bg-muted/80";
                  if (isRev) color = "bg-amber-500 text-white font-bold";
                  else if (isAns) color = "bg-primary text-primary-foreground font-bold";

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "h-8 rounded-md text-xs transition-all cursor-pointer font-mono",
                        color,
                        isCur && "ring-2 ring-foreground ring-offset-1 ring-offset-background"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-4 border-t mt-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-primary" />
                  <span>Answered ({Object.keys(answers).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-amber-500" />
                  <span>Marked for Review ({Object.keys(markedForReview).filter((k) => markedForReview[k]).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-muted border" />
                  <span>Unanswered ({questions.length - Object.keys(answers).length})</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Confirm Submission Dialog */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogDescription>
              Are you sure you want to finish this quiz? Your score and study progress will be calculated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span>Total Questions:</span>
              <span className="font-bold">{questions.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b text-emerald-600">
              <span>Answered:</span>
              <span className="font-bold">{Object.keys(answers).length}</span>
            </div>
            <div className="flex justify-between py-1 border-b text-muted-foreground">
              <span>Unanswered:</span>
              <span className="font-bold">{questions.length - Object.keys(answers).length}</span>
            </div>
            {isExam && (
              <div className="flex justify-between py-1 text-amber-600">
                <span>Marked for Review:</span>
                <span className="font-bold">
                  {Object.keys(markedForReview).filter((k) => markedForReview[k]).length}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Continue Quiz
            </Button>
            <Button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? "Submitting..." : "Yes, Submit Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
