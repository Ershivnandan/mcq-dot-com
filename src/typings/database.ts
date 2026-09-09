import { ObjectId } from "mongodb";
import { Difficulty, QuizMode, AIProviderType, DraftStatus, Theme } from "./enums";

export interface QuestionOption {
  id: string;
  optionText: string;
  optionOrder: number;
  isCorrect: boolean;
}

export interface QuestionAttemptAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface UserDocument {
  _id?: ObjectId;
  id?: string;
  email: string;
  passwordHash: string;
  name: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface UserPreferenceDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  theme: Theme | string;
  defaultQuizMode: QuizMode | "PRACTICE" | "EXAM";
  defaultQuestionCount: number;
  shuffleOptions: boolean;
  shuffleQuestions: boolean;
  spacedRepetition: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProviderConfigDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  provider: AIProviderType | "GEMINI" | "OPENAI" | "ANTHROPIC";
  encryptedKey: string;
  iv: string;
  tag: string;
  defaultModel: string;
  isDefault: boolean;
  isEnabled: boolean;
  detectedModels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIUsageLogDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  provider: AIProviderType | "GEMINI" | "OPENAI" | "ANTHROPIC";
  model: string;
  questionCount?: number;
  status?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  durationMs: number;
  success?: boolean;
  errorMessage?: string | null;
  createdAt: Date;
}

export interface TopicDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  topicId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface QuestionDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  questionText: string;
  explanation?: string | null;
  difficulty: Difficulty | "EASY" | "MEDIUM" | "HARD";
  questionDate?: Date | null;
  source?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
  isArchived?: boolean;
  topicId?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
  options: QuestionOption[];
  topic?: { id?: string; name: string } | null;
  category?: { id?: string; name: string } | null;
  orderIndex?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionProgressDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  questionId: string;
  attemptCount: number;
  correctCount: number;
  incorrectCount?: number;
  accuracy?: number;
  totalAttempts?: number;
  correctAttempts?: number;
  lastAttemptAt?: Date | null;
  lastCorrectAt?: Date | null;
  currentStreak: number;
  nextReviewAt?: Date | null;
  masteryLevel: number;
  easeFactor: number;
  intervalDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  title: string;
  description?: string | null;
  mode: QuizMode | "PRACTICE" | "EXAM";
  timeLimitMinutes?: number | null;
  questionIds: string[];
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showInstantFeedback?: boolean;
  isCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizAttemptDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  quizId?: string | null;
  title: string;
  mode: QuizMode | "PRACTICE" | "EXAM";
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount?: number;
  unansweredCount?: number;
  score: number;
  accuracy: number;
  timeSpentSeconds?: number;
  timeTakenSeconds?: number;
  answers: QuestionAttemptAnswer[];
  startedAt?: Date;
  completedAt: Date;
}

export interface AIDraftQuestionDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  prompt?: string;
  provider?: AIProviderType | string;
  model?: string;
  topicId?: string | null;
  questionDate?: Date | null;
  questionText: string;
  explanation?: string | null;
  difficulty: Difficulty | "EASY" | "MEDIUM" | "HARD";
  topic?: string | null;
  category?: string | null;
  tags?: string[];
  tagsJson?: any;
  options?: QuestionOption[];
  optionsJson?: any;
  relatedJson?: any;
  status: DraftStatus | "DRAFT" | "APPROVED" | "REJECTED";
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}
