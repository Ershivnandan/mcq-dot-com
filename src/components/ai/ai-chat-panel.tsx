"use client";

import * as React from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Database,
  Globe,
  Trash2,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  PROVIDER_MODELS_MAP,
  AIModelOption,
} from "@/lib/constants/ai-models";
import { ModelLimitsDialog } from "@/components/ai/model-limits-dialog";
import { useTopicsQuery } from "@/hooks/queries/use-topics";
import { Difficulty, AIProviderType } from "@/typings";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isRefinement?: boolean;
  draftCount?: number;
}

interface AIChatPanelProps {
  onGenerated: () => void;
  activeProvider: AIProviderType | string | null;
  configs?: any[];
  onRefineTarget?: string | null;
}

export function AIChatPanel({
  onGenerated,
  activeProvider,
  configs = [],
  onRefineTarget,
}: AIChatPanelProps) {
  const { data: topics = [] } = useTopicsQuery();

  // Generator & Model State
  const effectiveProvider = activeProvider || "GEMINI";
  const availableModels: AIModelOption[] =
    PROVIDER_MODELS_MAP[effectiveProvider] || GEMINI_MODELS;

  const rawConfiguredModel = configs.find(
    (c) => c.provider === effectiveProvider
  )?.defaultModel;
  const configuredModel =
    rawConfiguredModel &&
    !rawConfiguredModel.startsWith("gemini-2.") &&
    !rawConfiguredModel.startsWith("gemini-1.")
      ? rawConfiguredModel
      : DEFAULT_GEMINI_MODEL;

  const [selectedModel, setSelectedModel] = React.useState<string>(configuredModel);
  const [difficulty, setDifficulty] = React.useState<Difficulty>(Difficulty.MEDIUM);
  const [count, setCount] = React.useState(5);
  const [optionCount, setOptionCount] = React.useState(4);
  const [selectedTopicId, setSelectedTopicId] = React.useState("all");
  const [researchEnabled, setResearchEnabled] = React.useState(true);
  const [questionDate, setQuestionDate] = React.useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [showSettings, setShowSettings] = React.useState(false);

  // Chat State
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 **Welcome to the AI Question Studio!**\n\n• Enter a topic or specific question to generate MCQs.\n• If a question is not generated properly, simply tell me (e.g. *'Question 1 is not generated properly, make options harder'* or *'Regenerate Q2'*).\n• I'll use **MongoDB Atlas Vector RAG** and factual research to refine and perfect it.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle external refine click from draft card
  React.useEffect(() => {
    if (onRefineTarget) {
      setInput(`Question ${onRefineTarget} is not generated properly: `);
    }
  }, [onRefineTarget]);

  // Detect whether a prompt is a critique / refinement of existing draft
  const isRefinementPrompt = (text: string) => {
    const lower = text.toLowerCase();
    return (
      lower.includes("not generated properly") ||
      lower.includes("not proper") ||
      lower.includes("rewrite question") ||
      lower.includes("regenerate question") ||
      lower.includes("refine") ||
      lower.includes("fix question") ||
      lower.includes("wrong answer") ||
      lower.includes("incorrect option") ||
      lower.includes("make it harder") ||
      lower.includes("change question") ||
      lower.includes("question is bad") ||
      lower.includes("improve question") ||
      /(?:question|q|#)\s*\d+/i.test(text)
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = input.trim();
    if (!promptText || loading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const isRefinement = isRefinementPrompt(promptText);

      if (isRefinement) {
        // Call Refinement API with RAG
        const res = await fetch("/api/ai/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback: promptText,
            conversationHistory: messages.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to refine question.");

        const assistantMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: `✅ **Question Refined & Updated with Atlas RAG!**\n\nI addressed your feedback for: **"${data.draft?.questionText?.slice(0, 80)}..."**.\n\nThe updated draft is now available in your draft list on the left.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isRefinement: true,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        onGenerated();
      } else {
        // Call Question Generation API
        const selectedTopicObj = topics.find((t: any) => t.id === selectedTopicId);
        const resolvedTopicName = selectedTopicObj ? selectedTopicObj.name : "General";
        const resolvedTopicId = selectedTopicId !== "all" ? selectedTopicId : null;

        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptText,
            count,
            difficulty,
            optionCount,
            topicId: resolvedTopicId,
            topic: resolvedTopicName,
            questionDate: questionDate || new Date().toISOString().slice(0, 10),
            researchEnabled,
            clearPreviousDrafts: false, // Keep previous or append
            provider: effectiveProvider,
            model: selectedModel,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate questions.");

        const assistantMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: `🎉 **Generated ${data.count || count} New MCQs!**\n\nYour exact question and related questions have been created and placed in the review studio on the left. You can inspect, edit, or approve them now.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          draftCount: data.count || count,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        onGenerated();
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: `❌ **Error:** ${err.message || "Failed to process request."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    "Question 1 is not generated properly — rewrite with harder options",
    "What is the time complexity of searching in a Red-Black tree?",
    "Generate 5 tricky GATE questions on DBMS BCNF decomposition",
    "Make explanation more detailed with step-by-step reasoning",
  ];

  return (
    <Card className="h-full flex flex-col border-purple-500/30 bg-card shadow-sm overflow-hidden min-h-0">
      {/* Header */}
      <CardHeader className="p-4 border-b bg-muted/20 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>AI Chat Copilot</span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                  <Database className="h-2.5 w-2.5" />
                  <span>Atlas RAG</span>
                </span>
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              title="Toggle Generation Hyperparameters"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setMessages([
                  {
                    id: "reset",
                    role: "assistant",
                    content: "Chat cleared. Ready for your next questions or critique!",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ])
              }
              title="Clear Chat History"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Collapsible Model & Generation Settings */}
        {showSettings && (
          <div className="mt-3 pt-3 border-t space-y-3 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Model Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic & Difficulty */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none"
                >
                  <option value="all">General / Auto</option>
                  {topics.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Difficulty</label>
                <Select
                  value={difficulty}
                  onValueChange={(val) => setDifficulty(val as Difficulty)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Difficulty.EASY} className="text-xs">Easy</SelectItem>
                    <SelectItem value={Difficulty.MEDIUM} className="text-xs">Medium</SelectItem>
                    <SelectItem value={Difficulty.HARD} className="text-xs">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Question Count & Option Count */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Count</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Options</label>
                <Input
                  type="number"
                  min={2}
                  max={6}
                  value={optionCount}
                  onChange={(e) => setOptionCount(Math.max(2, parseInt(e.target.value, 10) || 4))}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* Real-time Research Switch */}
            <div className="flex items-center justify-between pt-1 border-t">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[11px] font-semibold text-foreground">Web Research Layer</span>
              </div>
              <Switch
                checked={researchEnabled}
                onCheckedChange={setResearchEnabled}
                className="scale-75"
              />
            </div>
          </div>
        )}
      </CardHeader>

      {/* Message Stream */}
      <CardContent className="flex-1 min-h-0 p-3 overflow-y-auto space-y-3 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role !== "user" && (
              <div className="h-6 w-6 rounded-full bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`rounded-xl px-3 py-2 max-w-[85%] space-y-1 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                  : "bg-muted/40 border border-border/70 text-foreground rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              <span
                className={`block text-[10px] ${
                  msg.role === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>

            {msg.role === "user" && (
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted/20 rounded-lg border">
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            <span className="text-xs font-semibold animate-pulse">
              Generating & researching with Atlas RAG...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Suggestion Chips */}
      <div className="p-2 border-t bg-muted/10 shrink-0 space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {quickPrompts.slice(0, 2).map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInput(qp)}
              className="text-[10px] text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 bg-background border rounded-md px-2 py-0.5 text-left truncate max-w-full transition-colors hover:border-purple-500/40"
            >
              💡 {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask question, paste problem, or critique draft (e.g. 'Question 1 is not proper')..."
            rows={2}
            className="text-xs resize-none min-h-[48px] max-h-[120px] focus-visible:ring-purple-500/50"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || loading}
            className="h-[48px] w-10 shrink-0 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <span className="block text-[10px] text-muted-foreground text-center">
          Press <kbd className="font-mono bg-muted px-1 rounded">Enter</kbd> to send, <kbd className="font-mono bg-muted px-1 rounded">Shift+Enter</kbd> for new line.
        </span>
      </div>
    </Card>
  );
}
