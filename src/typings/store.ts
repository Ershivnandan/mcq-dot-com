export interface UIState {
  viewMode: "cards" | "table";
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
}

export interface QuizProgressState {
  activeQuizId: string | null;
  currentQuestionIndex: number;
  userAnswers: Record<string, string>; // questionId -> selectedOptionId
  timeSpentSeconds: Record<string, number>;
  isCompleted: boolean;
}

export interface QuestionFiltersState {
  search: string;
  topicId: string;
  difficulty: string;
  isFavorite: boolean;
  isArchived: boolean;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
}
