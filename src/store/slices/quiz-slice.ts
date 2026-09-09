import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { QuizProgressState } from "@/typings";

export type { QuizProgressState };

const initialState: QuizProgressState = {
  activeQuizId: null,
  currentQuestionIndex: 0,
  userAnswers: {},
  timeSpentSeconds: {},
  isCompleted: false,
};

export const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    startQuiz: (state, action: PayloadAction<{ quizId: string }>) => {
      state.activeQuizId = action.payload.quizId;
      state.currentQuestionIndex = 0;
      state.userAnswers = {};
      state.timeSpentSeconds = {};
      state.isCompleted = false;
    },
    answerQuestion: (
      state,
      action: PayloadAction<{ questionId: string; optionId: string }>
    ) => {
      state.userAnswers[action.payload.questionId] = action.payload.optionId;
    },
    recordTimeSpent: (
      state,
      action: PayloadAction<{ questionId: string; seconds: number }>
    ) => {
      state.timeSpentSeconds[action.payload.questionId] =
        (state.timeSpentSeconds[action.payload.questionId] || 0) + action.payload.seconds;
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
    },
    completeQuiz: (state) => {
      state.isCompleted = true;
    },
    resetQuiz: () => initialState,
  },
});

export const {
  startQuiz,
  answerQuestion,
  recordTimeSpent,
  setCurrentQuestionIndex,
  completeQuiz,
  resetQuiz,
} = quizSlice.actions;

export default quizSlice.reducer;
