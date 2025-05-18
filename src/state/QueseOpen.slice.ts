import { createSlice } from "@reduxjs/toolkit";
import type { QueueOpenState } from "../types/QueueOpen";

const initialState: QueueOpenState = {
  isOpen: false,
};

export const queueOpenSlice = createSlice({
  name: "queueOpen",
  initialState: initialState,
  reducers: {
    setQueueOpen: (state, action) => {
      state.isOpen = action.payload;
    },
  },
});

export const { setQueueOpen } = queueOpenSlice.actions;

export default queueOpenSlice.reducer;


