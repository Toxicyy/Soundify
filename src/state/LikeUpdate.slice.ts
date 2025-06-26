import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LikeState } from "../types/LikeUpdate";

const initialState:LikeState = {
    isLiked: false,
    trackId: [],
};

export const likeUpdateSlice = createSlice({
    name: "likeUpdate",
    initialState,
    reducers: {
        toggleLike: (state: LikeState, action: PayloadAction<LikeState>) => {
            state.isLiked = action.payload.isLiked;
            state.trackId = action.payload.trackId;
        },
    },
});

export const { toggleLike } = likeUpdateSlice.actions;

export default likeUpdateSlice.reducer;