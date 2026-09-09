import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { QuestionFiltersState } from "@/typings";

export type { QuestionFiltersState };

const initialState: QuestionFiltersState = {
  search: "",
  topicId: "",
  difficulty: "",
  isFavorite: false,
  isArchived: false,
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 20,
};

export const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1;
    },
    setTopicId: (state, action: PayloadAction<string>) => {
      state.topicId = action.payload;
      state.page = 1;
    },
    setDifficulty: (state, action: PayloadAction<string>) => {
      state.difficulty = action.payload;
      state.page = 1;
    },
    toggleFavoriteFilter: (state) => {
      state.isFavorite = !state.isFavorite;
      state.page = 1;
    },
    toggleArchivedFilter: (state) => {
      state.isArchived = !state.isArchived;
      state.page = 1;
    },
    setDateRange: (
      state,
      action: PayloadAction<{ from: string | null; to: string | null }>
    ) => {
      state.dateFrom = action.payload.from || "";
      state.dateTo = action.payload.to || "";
      state.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
      state.page = 1;
    },
    setFilters: (state, action: PayloadAction<Partial<QuestionFiltersState>>) => {
      return { ...state, ...action.payload };
    },
    resetFilters: (state) => {
      return {
        ...initialState,
        limit: state.limit,
      };
    },
  },
});

export const {
  setSearch,
  setTopicId,
  setDifficulty,
  toggleFavoriteFilter,
  toggleArchivedFilter,
  setDateRange,
  setPage,
  setLimit,
  setFilters,
  resetFilters,
} = filterSlice.actions;

export default filterSlice.reducer;
