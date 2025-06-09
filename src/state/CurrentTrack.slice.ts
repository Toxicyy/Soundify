import { createSlice } from "@reduxjs/toolkit";
import type { CurrentTrackState } from "../types/CurrentTrack";

const initialState: CurrentTrackState = {
  currentTrack: null,
};

export const CurrentTrackSlice = createSlice({
  name: "currentTrack",
  initialState,
  reducers: {
    setCurrentTrack: (state, action) => {
      state.currentTrack = action.payload;
    },
  },
});

export const { setCurrentTrack } = CurrentTrackSlice.actions;

export default CurrentTrackSlice.reducer;
