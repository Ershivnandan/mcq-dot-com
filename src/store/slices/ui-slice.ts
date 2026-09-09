import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  viewMode: "cards" | "table";
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UIState = {
  viewMode: "cards",
  commandPaletteOpen: false,
  sidebarCollapsed: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<"cards" | "table">) => {
      state.viewMode = action.payload;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const {
  setViewMode,
  setCommandPaletteOpen,
  toggleCommandPalette,
  toggleSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
