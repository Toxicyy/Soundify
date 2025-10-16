import { createSlice } from "@reduxjs/toolkit";
import type { CurrentTrackState } from "../types/CurrentTrack";

const initialState: CurrentTrackState = {
  currentTrack: null,
  isPlaying: false,
};

export const CurrentTrackSlice = createSlice({
  name: "currentTrack",
  initialState,
  reducers: {
    setCurrentTrack: (state, action) => {
      state.currentTrack = action.payload;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    playTrack: (state, action) => {
      const newTrack = action.payload;
      const isDifferentTrack =
        !state.currentTrack || state.currentTrack.name !== newTrack?.name;

      if (isDifferentTrack) {
        state.currentTrack = newTrack;
        state.isPlaying = true;
      } else {
        state.isPlaying = !state.isPlaying;
      }
    },
  },
});

export const { setCurrentTrack, setIsPlaying, playTrack } =
  CurrentTrackSlice.actions;

export default CurrentTrackSlice.reducer;