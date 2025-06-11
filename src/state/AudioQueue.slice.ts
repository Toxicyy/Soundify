import { createSlice } from "@reduxjs/toolkit";
import type { AudioQueue } from "../types/AudioQueue";
import type { TrackData } from "../types/TrackData";

const initialState: AudioQueue = {
  queue: [],
};

export const audioQueueSlice = createSlice({
  name: "audioQueue",
  initialState: initialState,
  reducers: {
    addToQueueState: (state, action: { payload: Omit <TrackData, "id"> & { id: number } }) => {
      action.payload.id = state.queue.length + 1;
      state.queue.push(action.payload);
    },
    clearQueue: (state) => {
      state.queue = [];
    },
  },
});

export const { addToQueueState, clearQueue } = audioQueueSlice.actions;

export default audioQueueSlice.reducer;
