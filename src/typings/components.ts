import * as React from "react";
import { Difficulty, QuizMode, AIProviderType, BulkQuestionAction, Theme } from "./enums";
import { QuestionDocument, TopicDocument } from "./database";

// Option item in question forms
export interface OptionItem {
  id: string;
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

// Question Editor Props
export interface QuestionEditorProps {
  initialData?: {
    id?: string;
    questionText: string;
    explanation?: string | null;
    difficulty: Difficulty;
    questionDate?: string | Date | null;
    source?: string | null;
    notes?: string | null;
    isFavorite: boolean;
    topicId?: string | null;
    options: OptionItem[];
  };
  topics?: Array<{ id: string; name: string }>;
  isEditing?: boolean;
}

// Question Card Props
export interface QuestionCardProps {
  question: {
    id: string;
    questionText: string;
    explanation?: string | null;
    difficulty: Difficulty | string;
    questionDate?: string | Date | null;
    source?: string | null;
    notes?: string | null;
    isFavorite: boolean;
    isArchived?: boolean;
    topic?: { name: string } | null;
    options: Array<{
      id: string;
      optionText: string;
      optionOrder?: number;
      isCorrect: boolean;
    }>;
  };
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  showCheckboxes?: boolean;
  onDelete?: (id: string) => void;
}

// Question Table Props
export interface QuestionTableProps {
  questions: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

// Filter State & Filter Bar Props
export interface FilterState {
  search: string;
  topicId: string;
  difficulty: string;
  isFavorite: boolean;
  isArchived: boolean;
  dateFrom: string;
  dateTo: string;
  viewMode?: "cards" | "table";
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface QuestionFilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  topics: Array<{ id: string; name: string }>;
}

// Bulk Actions Bar Props
export interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onAction: (action: "favorite" | "archive" | "delete") => void;
}

// Quiz Runner & Quiz Results
export interface QuestionItem {
  id: string;
  questionText: string;
  explanation?: string | null;
  difficulty: Difficulty | string;
  topic?: { id?: string; name: string } | null;
  options: Array<{
    id: string;
    optionText: string;
    isCorrect: boolean;
  }>;
}

export interface QuizRunnerProps {
  quiz: {
    id: string;
    title: string;
    mode: QuizMode | "PRACTICE" | "EXAM";
    timeLimitMinutes?: number | null;
    showExplanations?: boolean;
    showInstantFeedback?: boolean;
    totalQuestions?: number;
  };
  questions: QuestionItem[];
}

export interface DetailedAnswer {
  questionId: string;
  questionText: string;
  options: Array<{ id: string; optionText: string; isCorrect: boolean }>;
  explanation?: string | null;
  difficulty?: Difficulty | string;
  topic?: string;
  category?: string;
  selectedOptionId: string | null;
  selectedOptionText?: string;
  correctOptionText?: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface QuizResultsProps {
  attempt: {
    id: string;
    quizId?: string | null;
    title: string;
    mode: QuizMode | "PRACTICE" | "EXAM";
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount?: number;
    skippedCount?: number;
    score: number;
    accuracy: number;
    timeSpentSeconds?: number;
    timeTakenSeconds?: number;
    completedAt?: string | Date;
    quiz?: any;
  };
  answers?: DetailedAnswer[];
  detailedAnswers?: DetailedAnswer[];
  quizId?: string | null;
}

export interface QuizCreatorProps {
  topics: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string; topicId?: string | null }>;
  stats?: {
    totalQuestions: number;
    dueForReview: number;
  };
}

// Dashboard Charts Props
export interface DashboardChartsProps {
  metrics: {
    overview: {
      totalQuestions: number;
      practicedCount: number;
      favoritesCount: number;
      archivedCount: number;
      quizAttemptsCount: number;
      overallAccuracy: number;
      currentStreak: number;
    };
    difficultyStats: Record<string, { total: number; correct: number; accuracy: number }>;
    questionsByDifficulty?: Record<string, number>;
    questionsByTopic?: Array<{ name: string; count: number }>;
    masteryBreakdown?: {
      mastered: number;
      learning: number;
      unattempted: number;
      masteredPct: number;
      learningPct: number;
      unattemptedPct: number;
    };
    weeklyActivity?: Array<{ day: string; date: string; attempts: number; questions: number }>;
    recentActivity?: Array<{ date: string; accuracy: number; score: number; total: number }>;
  };
}

// Analytics Dashboard Props
export interface AnalyticsDashboardProps {
  metrics: {
    overview: {
      totalQuestions: number;
      practicedCount: number;
      favoritesCount: number;
      archivedCount: number;
      quizAttemptsCount: number;
      overallAccuracy: number;
      currentStreak: number;
    };
    difficultyStats: Record<string, { total: number; correct: number; accuracy: number }>;
    topicStats: Array<{ name: string; attempts: number; correct: number; accuracy: number }>;
    strongestTopics: Array<{ name: string; attempts: number; accuracy: number }>;
    weakestTopics: Array<{ name: string; attempts: number; accuracy: number }>;
    recentActivity: Array<{ date: string; accuracy: number; score: number; total: number }>;
    recentQuizzes: any[];
  };
}

// AI Panels and Dialogs
export interface AIGeneratorPanelProps {
  onGenerated: () => void;
  activeProvider?: string | null;
  configs?: any[];
}

export interface AIDraftCardProps {
  draft: {
    id: string;
    questionText: string;
    explanation?: string | null;
    difficulty: Difficulty | "EASY" | "MEDIUM" | "HARD" | string;
    topic?: string | null;
    topicId?: string | null;
    questionDate?: string | Date | null;
    category?: string | null;
    optionsJson: any;
    tagsJson?: any;
    createdAt: string | Date;
  };
  onApprove: (id: string, overrides?: any) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export interface ModelLimitsDialogProps {
  provider?: AIProviderType | string;
  trigger?: React.ReactNode;
}

// Date Pickers
export interface DatePickerProps {
  date?: string | Date | null;
  onSelect?: (date: string | null) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
  disabled?: boolean;
}

export interface DateRangePickerProps {
  dateFrom?: string | null;
  dateTo?: string | null;
  onSelect: (range: { from: string | null; to: string | null }) => void;
  className?: string;
  placeholder?: string;
}

export interface MonthPickerProps {
  value?: string | null;
  onSelect: (value: string | null, details?: { from: string; to: string; label: string }) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
  disabled?: boolean;
}

// Layout & Providers
export interface HeaderProps {
  onMenuToggle?: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export type ThemeValue = Theme | "light" | "dark" | "oled" | "sepia" | "system";

export interface ThemeContextType {
  theme: ThemeValue;
  setTheme: (theme: ThemeValue) => void;
}

export interface AppProvidersProps {
  children: React.ReactNode;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}
