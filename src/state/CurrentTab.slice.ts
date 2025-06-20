import { createSlice } from "@reduxjs/toolkit";
import type { CurrentTabState } from "../types/CurrentTabState";

const initialState: CurrentTabState = {
  currentTab: "Home",
};

export const currentTabSlice = createSlice({
  name: "currentTab",
  initialState: initialState,
  reducers: {
    setCurrentTab: (state, action) => {
      state.currentTab = action.payload;
    },
  },
});

export const { setCurrentTab } = currentTabSlice.actions;

export default currentTabSlice.reducer;
