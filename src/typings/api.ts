import { Difficulty, QuizMode, AIProviderType } from "./enums";
import { QuestionDocument } from "./database";

// Auth User in session
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
}

// Crypto Encrypted Data
export interface EncryptedData {
  encryptedKey: string;
  iv: string;
  tag: string;
}

// AI Generation Options & Provider Interface
export interface AIGenerationOptions {
  prompt?: string;
  count?: number;
  difficulty?: Difficulty | "EASY" | "MEDIUM" | "HARD";
  topic?: string;
  category?: string;
  researchEnabled?: boolean;
  contextData?: string;
  provider?: AIProviderType | string;
  model?: string;
  topicId?: string | null;
  questionDate?: string | Date | null;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  models?: string[];
}

export interface AIProvider {
  readonly id: AIProviderType | "GEMINI" | "OPENAI" | "ANTHROPIC";
  testConnection(apiKey: string): Promise<ConnectionTestResult>;
  generateQuestions(
    apiKey: string,
    model: string,
    options: AIGenerationOptions
  ): Promise<any[]>;
}

export interface AIModelOption {
  id: string;
  name: string;
  badge: string;
  description?: string;
  freeRpm?: string;
  freeRpd?: string;
  freeTpm?: string;
  paidRpm?: string;
  contextWindow?: string;
  limitsSummary?: string;
  tier?: string;
  provider?: AIProviderType | string;
}

// Import Summary
export interface ImportSummary {
  imported: number;
  skipped: number;
  duplicates: number;
  invalid: number;
  dateHeadersFound: number;
  topicsCreated: string[];
  totalInFile?: number;
  failed?: number;
  errors?: string[];
}

// React Query Hook Interfaces
export interface TopicItem {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { questions: number };
}

export interface QuestionFiltersQueryParams {
  search?: string;
  topicId?: string;
  difficulty?: Difficulty | string;
  isFavorite?: boolean;
  isArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface QuestionListResponse {
  questions: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AIProviderConfigResponse {
  id?: string;
  provider: AIProviderType | "GEMINI" | "OPENAI" | "ANTHROPIC";
  maskedKey?: string;
  hasKey?: boolean;
  defaultModel: string;
  isDefault: boolean;
  isEnabled: boolean;
  detectedModels?: string[];
  updatedAt: string;
}

export interface ApproveDraftParams {
  id: string;
  overrides?: {
    questionText?: string;
    explanation?: string | null;
    options?: any[];
    topicId?: string | null;
    questionDate?: string | Date | null;
    difficulty?: Difficulty | string;
  };
}
