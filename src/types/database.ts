import { ObjectId } from "mongodb";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuizMode = "PRACTICE" | "EXAM";
export type AIProviderType = "GEMINI" | "OPENAI" | "ANTHROPIC";
export type DraftStatus = "DRAFT" | "APPROVED" | "REJECTED";

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
  theme: string; // light, dark, system, oled, sepia
  defaultQuizMode: QuizMode;
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
  provider: AIProviderType;
  encryptedKey: string;
  iv: string;
  tag: string;
  defaultModel: string;
  isDefault: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIUsageLogDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  provider: AIProviderType;
  model: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  durationMs: number;
  questionCount: number;
  status: "SUCCESS" | "FAILED";
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
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  name: string;
  slug: string;
  color?: string | null;
  questionIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  questionText: string;
  explanation?: string | null;
  difficulty: Difficulty;
  questionDate?: Date | null;
  source?: string | null;
  notes?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  topicId?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
  options: QuestionOption[];
  createdAt: Date;
  updatedAt: Date;
  topic?: TopicDocument | null;
  category?: CategoryDocument | null;
}

export interface QuestionProgressDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  questionId: string;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
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
  mode: QuizMode;
  timeLimitMinutes?: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanations: boolean;
  questionIds: string[];
  totalQuestions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizAttemptDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  quizId?: string | null;
  title: string;
  mode: QuizMode;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  accuracy: number;
  timeTakenSeconds: number;
  answers: QuestionAttemptAnswer[];
  completedAt: Date;
  createdAt: Date;
}

export interface AIDraftQuestionDocument {
  _id?: ObjectId;
  id?: string;
  userId: string;
  prompt: string;
  questionText: string;
  optionsJson: any;
  explanation?: string | null;
  topic?: string | null;
  topicId?: string | null;
  questionDate?: Date | null;
  category?: string | null;
  difficulty: Difficulty;
  tagsJson?: any;
  relatedJson?: any;
  status: DraftStatus;
  createdAt: Date;
  updatedAt: Date;
}
