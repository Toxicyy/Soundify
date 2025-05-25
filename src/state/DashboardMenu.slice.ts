import { createSlice } from "@reduxjs/toolkit";
import type { DashboardMenuState } from "../types/DashboardMenu";

const initialState: DashboardMenuState = {
  isOpen: false,
};

export const dashboardMenuSlice = createSlice({
  name: "dashboardMenu",
  initialState: initialState,
  reducers: {
    setMenuOpen: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { setMenuOpen } = dashboardMenuSlice.actions;

export default dashboardMenuSlice.reducer;


