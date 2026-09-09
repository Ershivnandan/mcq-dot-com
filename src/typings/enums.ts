export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export enum QuizMode {
  PRACTICE = "PRACTICE",
  EXAM = "EXAM",
}

export enum AIProviderType {
  GEMINI = "GEMINI",
  OPENAI = "OPENAI",
  ANTHROPIC = "ANTHROPIC",
}

export enum DraftStatus {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system",
  OLED = "oled",
  SEPIA = "sepia",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export enum BulkQuestionAction {
  DELETE = "delete",
  FAVORITE = "favorite",
  UNFAVORITE = "unfavorite",
  ARCHIVE = "archive",
  RESTORE = "restore",
  SET_DIFFICULTY = "set_difficulty",
  SET_TOPIC = "set_topic",
}
