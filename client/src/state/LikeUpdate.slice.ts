import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface LikeState {
  likedTracks: string[]; // Используем массив для совместимости с Immer
  pendingUpdates: string[]; // Треки, которые находятся в процессе обновления
}

const initialState: LikeState = {
  likedTracks: [],
  pendingUpdates: [],
};

export const likeUpdateSlice = createSlice({
  name: "likeUpdate",
  initialState,
  reducers: {
    // Инициализация лайков из user.likedSongs
    initializeLikes: (state, action: PayloadAction<string[]>) => {
      state.likedTracks = action.payload;
    },

    // Добавление лайка (оптимистичное обновление)
    addLike: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      if (!state.likedTracks.includes(trackId)) {
        state.likedTracks.push(trackId);
      }
      if (!state.pendingUpdates.includes(trackId)) {
        state.pendingUpdates.push(trackId);
      }
    },

    // Удаление лайка (оптимистичное обновление)
    removeLike: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      state.likedTracks = state.likedTracks.filter((id) => id !== trackId);
      if (!state.pendingUpdates.includes(trackId)) {
        state.pendingUpdates.push(trackId);
      }
    },

    // Подтверждение успешного обновления на сервере
    confirmLikeUpdate: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      state.pendingUpdates = state.pendingUpdates.filter(
        (id) => id !== trackId
      );
    },

    // Откат изменений при ошибке
    revertLikeUpdate: (
      state,
      action: PayloadAction<{ trackId: string; wasLiked: boolean }>
    ) => {
      const { trackId, wasLiked } = action.payload;
      if (wasLiked) {
        // Восстанавливаем лайк
        if (!state.likedTracks.includes(trackId)) {
          state.likedTracks.push(trackId);
        }
      } else {
        // Убираем лайк
        state.likedTracks = state.likedTracks.filter((id) => id !== trackId);
      }
      state.pendingUpdates = state.pendingUpdates.filter(
        (id) => id !== trackId
      );
    },

    // Очистка всех лайков
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

// Селекторы
export const selectIsLiked = (
  state: { likeUpdate: LikeState },
  trackId: string
) => state.likeUpdate.likedTracks.includes(trackId);

export const selectIsPending = (
  state: { likeUpdate: LikeState },
  trackId: string
) => state.likeUpdate.pendingUpdates.includes(trackId);
