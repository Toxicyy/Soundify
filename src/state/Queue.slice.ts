import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { QueueState } from "../types/QueueState";
import type { Track } from "../types/TrackData";
import { setCurrentTrack, setIsPlaying } from "./CurrentTrack.slice";

const initialState: QueueState = {
  isOpen: false,
  queue: [],
  currentIndex: 0,
  history: [],
  shuffle: false,
  repeat: "off",
  shuffledIndexes: [],
};

// Async thunks for complex operations that need to dispatch multiple actions
export const playTrackFromQueue = createAsyncThunk(
  "queue/playTrackFromQueue",
  async (index: number, { dispatch, getState }) => {
    dispatch(setCurrentIndex(index));
    const state = getState() as { queue: QueueState };
    const track = state.queue.queue[index];

    if (track) {
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
    }

    return index;
  }
);

export const playNextTrack = createAsyncThunk(
  "queue/playNextTrack",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue, currentIndex, shuffle, repeat, shuffledIndexes } =
      state.queue;

    if (queue.length === 0) return;

    let nextIndex = currentIndex;

    if (repeat === "one") {
      // Repeat current track - don't change index
      const currentTrack = queue[currentIndex];
      if (currentTrack) {
        dispatch(setCurrentTrack(currentTrack));
        dispatch(setIsPlaying(true));
      }
      return currentIndex;
    }

    if (shuffle && shuffledIndexes.length > 0) {
      // Find current position in shuffled array
      const currentShuffledIndex = shuffledIndexes.indexOf(currentIndex);
      if (currentShuffledIndex < shuffledIndexes.length - 1) {
        nextIndex = shuffledIndexes[currentShuffledIndex + 1];
      } else if (repeat === "all") {
        nextIndex = shuffledIndexes[0];
      } else {
        // End of shuffled queue and repeat is off
        dispatch(setIsPlaying(false));
        return currentIndex;
      }
    } else {
      // Normal sequential playback
      if (currentIndex < queue.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (repeat === "all") {
        nextIndex = 0;
      } else {
        // End of queue and repeat is off
        dispatch(setIsPlaying(false));
        return currentIndex;
      }
    }

    dispatch(setCurrentIndex(nextIndex));
    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      dispatch(setCurrentTrack(nextTrack));
      dispatch(setIsPlaying(true));
    }

    return nextIndex;
  }
);

export const playPreviousTrack = createAsyncThunk(
  "queue/playPreviousTrack",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue, currentIndex, shuffle, shuffledIndexes, history } =
      state.queue;

    if (queue.length === 0) return;

    let prevIndex = currentIndex;

    if (shuffle && shuffledIndexes.length > 0) {
      // In shuffle mode, use history if available
      if (history.length > 0) {
        const lastTrack = history[history.length - 1];
        prevIndex = queue.findIndex((track) => track._id === lastTrack._id);
        dispatch(removeFromHistory());
      } else {
        // Fallback to previous in shuffled array
        const currentShuffledIndex = shuffledIndexes.indexOf(currentIndex);
        if (currentShuffledIndex > 0) {
          prevIndex = shuffledIndexes[currentShuffledIndex - 1];
        } else {
          prevIndex = shuffledIndexes[shuffledIndexes.length - 1];
        }
      }
    } else {
      // Normal sequential playback
      if (currentIndex > 0) {
        prevIndex = currentIndex - 1;
      } else {
        prevIndex = queue.length - 1;
      }
    }

    dispatch(setCurrentIndex(prevIndex));
    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      dispatch(setCurrentTrack(prevTrack));
      dispatch(setIsPlaying(true));
    }

    return prevIndex;
  }
);

export const setQueueAndPlay = createAsyncThunk(
  "queue/setQueueAndPlay",
  async (
    { tracks, startIndex = 0 }: { tracks: Track[]; startIndex?: number },
    { dispatch }
  ) => {
    dispatch(setQueue({ tracks, startIndex }));

    if (tracks.length > 0 && startIndex < tracks.length) {
      const trackToPlay = tracks[startIndex];
      dispatch(setCurrentTrack(trackToPlay));
      dispatch(setIsPlaying(true));
    }

    return { tracks, startIndex };
  }
);

export const queueSlice = createSlice({
  name: "queue",
  initialState,
  reducers: {
    setQueueOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },

    addToQueue: (state, action: PayloadAction<Track>) => {
      // Prevent duplicates
      const exists = state.queue.some(
        (track) => track._id === action.payload._id
      );
      if (!exists) {
        state.queue.push(action.payload);
      }
    },

    removeFromQueue: (state, action: PayloadAction<{ _id: number }>) => {
      const indexToRemove = state.queue.findIndex(
        (track) => track._id === action.payload._id
      );

      if (indexToRemove !== -1) {
        state.queue.splice(indexToRemove, 1);

        // Adjust currentIndex if necessary
        if (indexToRemove < state.currentIndex) {
          state.currentIndex--;
        } else if (indexToRemove === state.currentIndex) {
          // If we removed the current track, adjust accordingly
          if (state.currentIndex >= state.queue.length) {
            state.currentIndex = Math.max(0, state.queue.length - 1);
          }
        }

        // Update shuffled indexes if shuffle is enabled
        if (state.shuffle) {
          state.shuffledIndexes = state.shuffledIndexes
            .filter((index) => index !== indexToRemove)
            .map((index) => (index > indexToRemove ? index - 1 : index));
        }
      }
    },

    insertInQueue: (
      state,
      action: PayloadAction<{ track: Track; position: number }>
    ) => {
      const { track, position } = action.payload;
      const safePosition = Math.max(0, Math.min(position, state.queue.length));

      state.queue.splice(safePosition, 0, track);

      // Adjust currentIndex if insertion affects it
      if (safePosition <= state.currentIndex) {
        state.currentIndex++;
      }

      // Regenerate shuffled indexes if shuffle is enabled
      if (state.shuffle) {
        state.shuffledIndexes = generateShuffledIndexes(
          state.queue.length,
          state.currentIndex
        );
      }
    },

    playNext: (state, action: PayloadAction<Track>) => {
      // Insert track right after current track
      const insertPosition = state.currentIndex + 1;
      state.queue.splice(insertPosition, 0, action.payload);

      // Regenerate shuffled indexes if shuffle is enabled
      if (state.shuffle) {
        state.shuffledIndexes = generateShuffledIndexes(
          state.queue.length,
          state.currentIndex
        );
      }
    },

    setQueue: (
      state,
      action: PayloadAction<{ tracks: Track[]; startIndex?: number }>
    ) => {
      const { tracks, startIndex = 0 } = action.payload;
      state.queue = tracks;
      state.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
      state.history = [];

      // Generate shuffled indexes if shuffle is enabled
      if (state.shuffle && tracks.length > 0) {
        state.shuffledIndexes = generateShuffledIndexes(
          tracks.length,
          state.currentIndex
        );
      }
    },

    setCurrentIndex: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.queue.length) {
        // Add current track to history before changing
        if (state.queue[state.currentIndex]) {
          state.history.push(state.queue[state.currentIndex]);
          // Keep history manageable (last 50 tracks)
          if (state.history.length > 50) {
            state.history.shift();
          }
        }

        state.currentIndex = action.payload;
      }
    },

    clearQueue: (state) => {
      state.queue = [];
      state.currentIndex = 0;
      state.history = [];
      state.shuffledIndexes = [];
    },

    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;

      if (state.shuffle && state.queue.length > 0) {
        // Generate shuffled indexes
        state.shuffledIndexes = generateShuffledIndexes(
          state.queue.length,
          state.currentIndex
        );
      } else {
        state.shuffledIndexes = [];
      }
    },

    toggleRepeat: (state) => {
      const modes: Array<"off" | "all" | "one"> = ["off", "all", "one"];
      const currentIndex = modes.indexOf(state.repeat);
      state.repeat = modes[(currentIndex + 1) % modes.length];
    },

    setRepeat: (state, action: PayloadAction<"off" | "all" | "one">) => {
      state.repeat = action.payload;
    },

    reorderQueue: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) => {
      const { fromIndex, toIndex } = action.payload;

      if (
        fromIndex >= 0 &&
        fromIndex < state.queue.length &&
        toIndex >= 0 &&
        toIndex < state.queue.length
      ) {
        const [movedTrack] = state.queue.splice(fromIndex, 1);
        state.queue.splice(toIndex, 0, movedTrack);

        // Adjust currentIndex
        if (fromIndex === state.currentIndex) {
          state.currentIndex = toIndex;
        } else if (
          fromIndex < state.currentIndex &&
          toIndex >= state.currentIndex
        ) {
          state.currentIndex--;
        } else if (
          fromIndex > state.currentIndex &&
          toIndex <= state.currentIndex
        ) {
          state.currentIndex++;
        }

        // Regenerate shuffled indexes if shuffle is enabled
        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            state.currentIndex
          );
        }
      }
    },

    removeFromHistory: (state) => {
      state.history.pop();
    },
  },
});

// Utility function to generate shuffled indexes
function generateShuffledIndexes(
  length: number,
  currentIndex: number
): number[] {
  const indexes = Array.from({ length }, (_, i) => i).filter(
    (i) => i !== currentIndex
  );

  // Fisher-Yates shuffle
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }

  return indexes;
}

// Export actions
export const {
  setQueueOpen,
  addToQueue,
  removeFromQueue,
  insertInQueue,
  playNext,
  setQueue,
  setCurrentIndex,
  clearQueue,
  toggleShuffle,
  toggleRepeat,
  setRepeat,
  reorderQueue,
  removeFromHistory,
} = queueSlice.actions;

export default queueSlice.reducer;
