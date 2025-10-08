import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface LikeState {
  likedTracks: string[];
  pendingUpdates: string[];
}

const initialState: LikeState = {
  likedTracks: [],
  pendingUpdates: [],
};

export const likeUpdateSlice = createSlice({
  name: "likeUpdate",
  initialState,
  reducers: {
    initializeLikes: (state, action: PayloadAction<string[]>) => {
      state.likedTracks = action.payload;
    },

    addLike: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      if (!state.likedTracks.includes(trackId)) {
        state.likedTracks.push(trackId);
      }
      if (!state.pendingUpdates.includes(trackId)) {
        state.pendingUpdates.push(trackId);
      }
    },

    removeLike: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      state.likedTracks = state.likedTracks.filter((id) => id !== trackId);
      if (!state.pendingUpdates.includes(trackId)) {
        state.pendingUpdates.push(trackId);
      }
    },

    confirmLikeUpdate: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      state.pendingUpdates = state.pendingUpdates.filter(
        (id) => id !== trackId
      );
    },

    revertLikeUpdate: (
      state,
      action: PayloadAction<{ trackId: string; wasLiked: boolean }>
    ) => {
      const { trackId, wasLiked } = action.payload;
      if (wasLiked) {
        if (!state.likedTracks.includes(trackId)) {
          state.likedTracks.push(trackId);
        }
      } else {
        state.likedTracks = state.likedTracks.filter((id) => id !== trackId);
      }
      state.pendingUpdates = state.pendingUpdates.filter(
        (id) => id !== trackId
      );
    },

    clearLikes: (state) => {
      state.likedTracks = [];
      state.pendingUpdates = [];
    },
  },
});

export const {
  initializeLikes,
  addLike,
  removeLike,
  confirmLikeUpdate,
  revertLikeUpdate,
  clearLikes,
} = likeUpdateSlice.actions;

export default likeUpdateSlice.reducer;

export const selectIsLiked = (
  state: { likeUpdate: LikeState },
  trackId: string
) => state.likeUpdate.likedTracks.includes(trackId);

export const selectIsPending = (
  state: { likeUpdate: LikeState },
  trackId: string
) => state.likeUpdate.pendingUpdates.includes(trackId);
