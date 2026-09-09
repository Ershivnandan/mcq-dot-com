import { z } from "zod";
import { Difficulty, QuizMode, AIProviderType, DraftStatus, BulkQuestionAction } from "@/typings";

export const DifficultyEnum = z.nativeEnum(Difficulty);
export const QuizModeEnum = z.nativeEnum(QuizMode);
export const AIProviderTypeEnum = z.nativeEnum(AIProviderType);
export const DraftStatusEnum = z.nativeEnum(DraftStatus);

// Auth Schemas
export const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// Question Option Schema
export const QuestionOptionSchema = z.object({
  id: z.string().optional(),
  optionText: z.string().min(1, "Option text cannot be empty"),
  optionOrder: z.number().int().default(0),
  isCorrect: z.boolean().default(false),
});

// Question Create/Update Schema
export const QuestionInputSchema = z.object({
  questionText: z.string().min(3, "Question text must be at least 3 characters"),
  explanation: z.string().optional().nullable(),
  difficulty: DifficultyEnum.default(Difficulty.MEDIUM),
  questionDate: z.string().or(z.date()).optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isFavorite: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  topicId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  options: z.array(QuestionOptionSchema).min(2, "Questions must have at least 2 options"),
}).refine(
  (data) => data.options.some((opt) => opt.isCorrect),
  { message: "At least one option must be marked as correct", path: ["options"] }
);

// Bulk Questions Schema
export const BulkQuestionActionSchema = z.object({
  questionIds: z.array(z.string()).min(1, "Select at least one question"),
  action: z.nativeEnum(BulkQuestionAction),
  payload: z.any().optional(),
});

// Filter & Search Query Schema
export const QuestionQuerySchema = z.object({
  search: z.string().optional(),
  topicId: z.string().optional(),
  tagId: z.string().optional(),
  difficulty: DifficultyEnum.optional(),
  isFavorite: z.string().transform((v) => v === "true").optional(),
  isArchived: z.string().transform((v) => v === "true").optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["questionDate", "createdAt", "updatedAt", "alphabetical", "difficulty", "accuracy"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.string().transform((v) => Math.max(1, parseInt(v) || 1)).default("1"),
  limit: z.string().transform((v) => Math.min(100, Math.max(1, parseInt(v) || 20))).default("20"),
});

// Quiz Creation Schema
export const CreateQuizSchema = z.object({
  title: z.string().min(2, "Quiz title must be at least 2 characters"),
  description: z.string().optional(),
  mode: QuizModeEnum.default(QuizMode.PRACTICE),
  timeLimitMinutes: z.number().int().positive().optional().nullable(),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  showExplanations: z.boolean().default(true),
  questionCount: z.number().int().min(1).max(200).default(20),
  // Selection criteria
  topicId: z.string().optional().nullable(),
  difficulty: DifficultyEnum.optional().nullable(),
  tagId: z.string().optional().nullable(),
  onlyFavorites: z.boolean().default(false),
  onlyIncorrect: z.boolean().default(false),
  dueForReviewOnly: z.boolean().default(false),
  specificQuestionIds: z.array(z.string()).optional(),
});


// Submit Quiz Attempt Schema
export const SubmitQuizAttemptSchema = z.object({
  quizId: z.string().optional().nullable(),
  title: z.string(),
  mode: QuizModeEnum,
  timeTakenSeconds: z.number().int().nonnegative().default(0),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionId: z.string().nullable().optional(),
      isCorrect: z.boolean(),
      timeSpentSeconds: z.number().int().nonnegative().default(0),
    })
  ),
});

// AI Configuration Schema
export const AIConfigInputSchema = z.object({
  provider: AIProviderTypeEnum,
  apiKey: z.string().min(1, "API Key is required"),
  defaultModel: z.string().min(1, "Model is required"),
  isDefault: z.boolean().default(false),
});

// AI Generate Request Schema
export const AIGenerateRequestSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters"),
  count: z.number().int().min(1).max(20).default(5),
  difficulty: DifficultyEnum.optional(),
  topicId: z.string().optional().nullable(),
  topic: z.string().optional(),
  category: z.string().optional(),
  questionDate: z.string().optional().nullable(),
  provider: AIProviderTypeEnum.optional(),
  model: z.string().optional(),
  researchEnabled: z.boolean().default(false),
  contextData: z.string().optional(),
});

// AI Single Generated Question Output Schema (Strict validation)
export const AIGeneratedQuestionOutputSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).min(2).max(8),
  correctOptionIndex: z.number().int().min(0),
  explanation: z.string().optional().default(""),
  topic: z.string().optional().default("General"),
  category: z.string().optional().default("General"),
  difficulty: DifficultyEnum.default(Difficulty.MEDIUM),
  tags: z.array(z.string()).optional().default([]),
  relatedQuestions: z.array(z.string()).optional().default([]),
});

export const AIGeneratedResponseSchema = z.object({
  questions: z.array(AIGeneratedQuestionOutputSchema),
});
