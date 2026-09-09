"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  ArrowLeft,
  Calendar,
  Sparkles,
  HelpCircle,
  Cpu,
  Bot,
  Zap,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GEMINI_MODELS, DEFAULT_GEMINI_MODEL } from "@/lib/constants/ai-models";
import { ModelLimitsDialog } from "@/components/ai/model-limits-dialog";
import { cn } from "@/lib/utils";

interface OptionItem {
  id: string;
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

interface QuestionEditorProps {
  initialData?: {
    id?: string;
    questionText: string;
    explanation?: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    questionDate?: string | Date | null;
    source?: string | null;
    notes?: string | null;
    isFavorite: boolean;
    topicId?: string | null;
    options: OptionItem[];
  };
  topics: Array<{ id: string; name: string }>;
  isEditing?: boolean;
}

export function QuestionEditor({
  initialData,
  topics,
  isEditing = false,
}: QuestionEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [questionText, setQuestionText] = React.useState(initialData?.questionText || "");
  const [explanation, setExplanation] = React.useState(initialData?.explanation || "");
  const [difficulty, setDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">(
    initialData?.difficulty || "MEDIUM"
  );
  const [questionDate, setQuestionDate] = React.useState<string>(
    initialData?.questionDate
      ? new Date(initialData.questionDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [source, setSource] = React.useState(initialData?.source || "");
  const [notes, setNotes] = React.useState(initialData?.notes || "");
  const [isFavorite, setIsFavorite] = React.useState(initialData?.isFavorite || false);
  const [topicId, setTopicId] = React.useState(initialData?.topicId || "");

  // Topics management state
  const [topicList, setTopicList] = React.useState(topics);
  const [createTopicModalOpen, setCreateTopicModalOpen] = React.useState(false);
  const [newTopicName, setNewTopicName] = React.useState("");
  const [newTopicDesc, setNewTopicDesc] = React.useState("");
  const [newTopicColor, setNewTopicColor] = React.useState("#6366f1");
  const [creatingTopic, setCreatingTopic] = React.useState(false);
  const [createTopicError, setCreateTopicError] = React.useState<string | null>(null);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setCreatingTopic(true);
    setCreateTopicError(null);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTopicName.trim(),
          description: newTopicDesc.trim() || undefined,
          color: newTopicColor,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create topic");
      }
      const created = await res.json();
      setTopicList((prev) => [...prev, created]);
      setTopicId(created.id);
      setCreateTopicModalOpen(false);
      setNewTopicName("");
      setNewTopicDesc("");
    } catch (err: any) {
      setCreateTopicError(err.message || "Failed to create topic");
    } finally {
      setCreatingTopic(false);
    }
  };

  // AI Prompt Injection State
  const [aiModalOpen, setAiModalOpen] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiModel, setAiModel] = React.useState<string>(DEFAULT_GEMINI_MODEL);
  const [aiDifficulty, setAiDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = React.useState<string | null>(null);

  // Sync configured default model from settings
  React.useEffect(() => {
    fetch("/api/ai/config")
      .then((r) => r.json())
      .then((configs) => {
        if (Array.isArray(configs)) {
          const geminiConf = configs.find((c) => c.provider === "GEMINI");
          if (geminiConf?.defaultModel) {
            setAiModel(geminiConf.defaultModel);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Options state
  const [options, setOptions] = React.useState<OptionItem[]>(
    initialData?.options && initialData.options.length >= 2
      ? initialData.options
      : [
          { id: "opt_1", optionText: "", isCorrect: true, optionOrder: 0 },
          { id: "opt_2", optionText: "", isCorrect: false, optionOrder: 1 },
          { id: "opt_3", optionText: "", isCorrect: false, optionOrder: 2 },
          { id: "opt_4", optionText: "", isCorrect: false, optionOrder: 3 },
        ]
  );

  const addOption = () => {
    const nextIdx = options.length;
    setOptions([
      ...options,
      {
        id: `opt_${nextIdx + 1}`,
        optionText: "",
        isCorrect: false,
        optionOrder: nextIdx,
      },
    ]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      alert("A question must have at least 2 options.");
      return;
    }
    const updated = options.filter((_, i) => i !== idx);
    if (!updated.some((o) => o.isCorrect) && updated.length > 0) {
      updated[0].isCorrect = true;
    }
    setOptions(updated);
  };

  const updateOptionText = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx].optionText = text;
    setOptions(updated);
  };

  const setCorrectOption = (idx: number) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx,
    }));
    setOptions(updated);
  };

  const handleAiInject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiError(null);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          count: 1,
          difficulty: aiDifficulty,
          model: aiModel,
          provider: "GEMINI",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate question with AI.");
      }

      const draft = data.drafts?.[0];
      if (!draft) {
        throw new Error("No question was generated. Please try again.");
      }

      // Populate form state
      setQuestionText(draft.questionText || "");
      setExplanation(draft.explanation || "");
      if (draft.difficulty) {
        setDifficulty(draft.difficulty as "EASY" | "MEDIUM" | "HARD");
      }

      if (Array.isArray(draft.optionsJson) && draft.optionsJson.length >= 2) {
        setOptions(
          draft.optionsJson.map((opt: any, idx: number) => ({
            id: opt.id || `opt_${idx + 1}`,
            optionText: opt.optionText || opt.text || "",
            isCorrect: Boolean(opt.isCorrect),
            optionOrder: opt.optionOrder ?? idx,
          }))
        );
      }

      setAiSuccessMessage(`Successfully injected question generated with ${aiModel}!`);
      setAiModalOpen(false);
      setAiPrompt("");
    } catch (err: any) {
      setAiError(err.message || "Failed to generate question.");
    } finally {
      setAiLoading(false);
    }
  };

  const sampleAiPrompts = [
    "Create a GATE-level MCQ on DBMS BCNF decomposition and dependency preservation",
    "Generate a tricky question on JavaScript event loop microtasks vs macrotasks with code snippet",
    "Create a conceptual question on Python GIL and CPU-bound threading limitations",
    "Generate an exam question on Indian Constitution Fundamental Rights Article 21",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    const filledOptions = options.map((o) => ({
      ...o,
      optionText: o.optionText.trim(),
    }));

    if (filledOptions.some((o) => !o.optionText)) {
      setError("All option fields must have text.");
      return;
    }

    if (!filledOptions.some((o) => o.isCorrect)) {
      setError("Please select at least one correct option.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        questionText: questionText.trim(),
        explanation: explanation.trim() || null,
        difficulty,
        questionDate: questionDate ? new Date(questionDate).toISOString() : new Date().toISOString(),
        source: source.trim() || null,
        notes: notes.trim() || null,
        isFavorite,
        topicId: topicId && topicId !== "none" ? topicId : null,
        options: filledOptions,
      };

      const url = isEditing
        ? `/api/questions/${initialData?.id}`
        : "/api/questions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save question.");
      }

      router.push("/questions");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const activeModelDetails = GEMINI_MODELS.find((m) => m.id === aiModel);

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Button>

          <div className="flex items-center gap-2.5">
            {/* AI Prompt Injector Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setAiModalOpen(true)}
              className="gap-2 border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/60 font-semibold text-xs h-9 shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>AI Prompt Injector (Gemini)</span>
            </Button>

            <Button type="submit" disabled={loading} className="gap-2 font-semibold h-9">
              <Save className="h-4 w-4" />
              <span>{loading ? "Saving..." : isEditing ? "Update Question" : "Save Question"}</span>
            </Button>
          </div>
        </div>

        {/* Injected Notification Banner */}
        {aiSuccessMessage && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{aiSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setAiSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {isEditing ? "Edit Question" : "Create New Question"}
              </CardTitle>
              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles className="h-3 w-3" />
                <span>Inject from Gemini prompt</span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Question Statement <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="e.g. Which of the following is true about JavaScript closures?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="min-h-[100px] text-base leading-relaxed"
                required
              />
            </div>

            {/* Options List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Answer Options (select radio for the correct answer){" "}
                  <span className="text-destructive">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Option</span>
                </Button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      opt.isCorrect
                        ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                        : "border-border bg-card"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setCorrectOption(idx)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all cursor-pointer",
                        opt.isCorrect
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-muted-foreground/40 text-muted-foreground hover:border-emerald-500"
                      )}
                      title="Mark as correct answer"
                    >
                      {opt.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        String.fromCharCode(65 + idx)
                      )}
                    </button>

                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      value={opt.optionText}
                      onChange={(e) => updateOptionText(idx, e.target.value)}
                      className="flex-1 border-none shadow-none focus-visible:ring-0 px-1 bg-transparent text-sm"
                      required
                    />

                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(idx)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete option</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span>Explanation / Solution</span>
                <span className="text-xs text-muted-foreground font-normal">(shown during practice & review)</span>
              </label>
              <Textarea
                placeholder="Explain why the correct answer is right and why others are incorrect..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="min-h-[80px] text-sm"
              />
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {/* Topic (with user-creation support) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Topic</label>
                  <button
                    type="button"
                    onClick={() => setCreateTopicModalOpen(true)}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    + New Topic
                  </button>
                </div>
                <Select value={topicId} onValueChange={setTopicId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (No Topic)</SelectItem>
                    {topicList.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Difficulty</label>
                <Select
                  value={difficulty}
                  onValueChange={(val: any) => setDifficulty(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Question / Exam Date</span>
                </label>
                <Input
                  type="date"
                  value={questionDate}
                  onChange={(e) => setQuestionDate(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Source */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Source / Exam Name</label>
                <Input
                  placeholder="e.g. UPSC Prelims 2026, May 1"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Starred */}
              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="text-xs font-semibold text-muted-foreground mb-1">Bookmark / Star</label>
                <div className="flex items-center gap-2">
                  <Switch checked={isFavorite} onCheckedChange={setIsFavorite} />
                  <span className="text-sm font-medium">
                    {isFavorite ? "⭐ Starred" : "Normal"}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Personal Notes</label>
              <Input
                placeholder="Any personal hints, mnemonics, or revision reminders..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>
      </form>

      {/* AI Prompt Injection Modal / Dialog */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">
                    AI Prompt Injection (Question Generator)
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Choose a Gemini model and describe the question you want. It will automatically generate and inject into your form.
                  </DialogDescription>
                </div>
              </div>
              <ModelLimitsDialog provider="GEMINI" />
            </div>
          </DialogHeader>

          <form onSubmit={handleAiInject} className="space-y-4 pt-1">
            {aiError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
                {aiError}
              </div>
            )}

            {/* Model and Difficulty Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-purple-600" />
                    <span>Google Gemini Model</span>
                  </label>
                  {activeModelDetails?.limitsSummary && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                      {activeModelDetails.limitsSummary}
                    </span>
                  )}
                </div>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose Gemini model" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        <div className="flex items-center justify-between gap-3 py-0.5">
                          <span className="font-semibold">{m.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {m.freeRpd && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {m.freeRpd}
                              </span>
                            )}
                            <span className="text-[10px] rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 px-1.5 py-0.2 font-medium">
                              {m.badge}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeModelDetails && (
                  <div className="space-y-0.5 pt-0.5">
                    {activeModelDetails.description && (
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {activeModelDetails.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t border-border/40">
                      <span>Limit: <strong>{activeModelDetails.freeRpm || "15 RPM"} · {activeModelDetails.freeRpd || "1,500 RPD"}</strong></span>
                      <span>Context: {activeModelDetails.contextWindow || "1M"}</span>
                    </div>
                  </div>
                )}
              </div>


              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Target Difficulty
                </label>
                <Select
                  value={aiDifficulty}
                  onValueChange={(val: any) => setAiDifficulty(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Calibrates the question's distractor complexity and depth.
                </p>
              </div>
            </div>

            {/* Chat Prompt Injection Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Chat Prompt Injection
              </label>
              <Textarea
                placeholder="e.g. Create a GATE-level question on Dijkstra's Algorithm edge cases with 4 options and in-depth explanation..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[90px] text-sm"
                required
              />
            </div>

            {/* Prompt suggestions pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-muted-foreground self-center mr-1">Sample:</span>
              {sampleAiPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAiPrompt(p)}
                  className="text-[10px] rounded-full border border-purple-500/20 bg-purple-500/5 px-2 py-0.5 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40 transition-colors text-left"
                >
                  {p.slice(0, 36)}...
                </button>
              ))}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAiModalOpen(false)}
                disabled={aiLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={aiLoading || !aiPrompt.trim()}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating with {activeModelDetails?.name || aiModel}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate & Inject</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User-Created Topic Modal / Dialog */}
      <Dialog open={createTopicModalOpen} onOpenChange={setCreateTopicModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create New Topic</DialogTitle>
            <DialogDescription className="text-xs">
              Add a topic to categorize and organize your questions.
            </DialogDescription>
          </DialogHeader>

          {createTopicError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
              {createTopicError}
            </div>
          )}

          <form onSubmit={handleCreateTopic} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Topic Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Modern Indian History, Network Security, Calculus..."
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="h-9 text-sm"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Description (Optional)
              </label>
              <Input
                placeholder="Brief summary of what this topic covers"
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Color Tag
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTopicColor}
                  onChange={(e) => setNewTopicColor(e.target.value)}
                  className="h-8 w-12 rounded border p-0.5 cursor-pointer bg-transparent"
                />
                <span className="text-xs text-muted-foreground font-mono">{newTopicColor}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateTopicModalOpen(false)}
                disabled={creatingTopic}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creatingTopic || !newTopicName.trim()}
                className="font-semibold"
              >
                {creatingTopic ? "Creating..." : "Create Topic"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
