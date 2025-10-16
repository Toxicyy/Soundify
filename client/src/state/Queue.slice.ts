/**
 * Queue management slice with Spotify-like functionality
 * Handles current track, history, shuffle, repeat modes, and queue manipulation
 */

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
  currentTrack: null,
  originalQueue: [],
};

/**
 * Play track with optional context
 * @param track - Specific track to play
 * @param contextTracks - Context tracks (album, playlist)
 * @param startIndex - Starting index in context
 */
export const playTrackAndQueue = createAsyncThunk(
  "queue/playTrackAndQueue",
  async (
    {
      track,
      contextTracks,
      startIndex,
    }: {
      track?: Track;
      contextTracks?: Track[];
      startIndex?: number;
    },
    { dispatch, getState }
  ) => {
    const state = getState() as { queue: QueueState };
    const { currentTrack } = state.queue;

    if (currentTrack) {
      dispatch(addToHistory(currentTrack));
    }

    if (contextTracks && contextTracks.length > 0) {
      if (
        startIndex !== undefined &&
        startIndex >= 0 &&
        startIndex < contextTracks.length
      ) {
        dispatch(setQueue({ tracks: contextTracks, startIndex }));
        const selectedTrack = contextTracks[startIndex];
        dispatch(setCurrentTrack(selectedTrack));
        dispatch(setIsPlaying(true));
        return selectedTrack;
      }

      if (track) {
        dispatch(setCurrentTrackInQueue(track));
        dispatch(setCurrentTrack(track));

        const remainingTracks = contextTracks.filter(
          (t) => t._id !== track._id
        );
        dispatch(setQueueWithDuplicateCheck({ tracks: remainingTracks }));
      } else {
        const firstTrack = contextTracks[0];
        dispatch(setCurrentTrackInQueue(firstTrack));
        dispatch(setCurrentTrack(firstTrack));

        const remainingTracks = contextTracks.slice(1);
        dispatch(setQueueWithDuplicateCheck({ tracks: remainingTracks }));
      }
    } else if (track) {
      dispatch(setCurrentTrackInQueue(track));
      dispatch(setCurrentTrack(track));
      dispatch(clearQueue());
    }

    dispatch(setIsPlaying(true));
    return track || (contextTracks && contextTracks[startIndex || 0]) || null;
  }
);

/**
 * Handle track end based on repeat mode
 */
export const handleTrackEnd = createAsyncThunk(
  "queue/handleTrackEnd",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue, repeat, currentTrack, history } = state.queue;

    if (repeat === "one") {
      dispatch(setIsPlaying(false));
      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
      return "repeat_one";
    }

    if (queue.length > 0) {
      dispatch(playNextTrack());
      return "next_track";
    }

    if (repeat === "all") {
      if (history.length > 0) {
        if (currentTrack) {
          dispatch(addToHistory(currentTrack));
        }

        const allHistoryTracks = [...history];
        if (allHistoryTracks.length > 0) {
          const firstTrack = allHistoryTracks[0];
          dispatch(setCurrentTrackInQueue(firstTrack));
          dispatch(setCurrentTrack(firstTrack));

          const remainingTracks = allHistoryTracks.slice(1);
          dispatch(setQueue({ tracks: remainingTracks }));

          dispatch(clearHistory());
          dispatch(setIsPlaying(true));
          return "repeat_all_from_history";
        }
      }

      if (currentTrack) {
        dispatch(setIsPlaying(false));
        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
        return "repeat_all_current_only";
      }
    }

    dispatch(setIsPlaying(false));
    return "stop";
  }
);

/**
 * Move to next track in queue
 */
export const playNextTrack = createAsyncThunk(
  "queue/playNextTrack",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue, shuffle, shuffledIndexes, currentTrack } = state.queue;

    if (queue.length === 0) {
      dispatch(handleTrackEnd());
      return null;
    }

    let nextTrack: Track;

    if (shuffle && shuffledIndexes.length > 0) {
      const shuffledIndex = shuffledIndexes[0];
      nextTrack = queue[shuffledIndex];
      dispatch(removeShuffledIndex(0));
      dispatch(removeFromQueueByIndex(shuffledIndex));
    } else {
      nextTrack = queue[0];
      dispatch(removeFromQueueByIndex(0));
    }

    if (currentTrack) {
      dispatch(addToHistory(currentTrack));
    }

    dispatch(setCurrentTrackInQueue(nextTrack));
    dispatch(setCurrentTrack(nextTrack));
    dispatch(setIsPlaying(true));

    return nextTrack;
  }
);

/**
 * Move to previous track from history
 */
export const playPreviousTrack = createAsyncThunk(
  "queue/playPreviousTrack",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { history, currentTrack } = state.queue;

    if (history.length === 0) {
      if (currentTrack) {
        dispatch(setCurrentTrack(currentTrack));
        dispatch(setIsPlaying(true));
      }
      return null;
    }

    const previousTrack = history[history.length - 1];

    if (currentTrack) {
      dispatch(addToQueueFirst(currentTrack));
    }

    dispatch(setCurrentTrackInQueue(previousTrack));
    dispatch(setCurrentTrack(previousTrack));
    dispatch(removeFromHistory());
    dispatch(setIsPlaying(true));

    return previousTrack;
  }
);

export const playTrackFromQueue = createAsyncThunk(
  "queue/playTrackFromQueue",
  async (index: number, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue } = state.queue;

    if (index >= 0 && index < queue.length) {
      const track = queue[index];
      dispatch(
        playTrackAndQueue({ track, contextTracks: queue, startIndex: index })
      );
      return track;
    }
    return null;
  }
);

export const setQueueAndPlay = createAsyncThunk(
  "queue/setQueueAndPlay",
  async (
    { tracks, startIndex = 0 }: { tracks: Track[]; startIndex?: number },
    { dispatch }
  ) => {
    dispatch(playTrackAndQueue({ contextTracks: tracks, startIndex }));
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
    setCurrentTrackInQueue: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
    },
    addToQueueFirst: (state, action: PayloadAction<Track>) => {
      const trackToAdd = action.payload;

      if (state.currentTrack && state.currentTrack._id === trackToAdd._id) {
        return;
      }

      const exists = state.queue.some((track) => track._id === trackToAdd._id);
      const recentHistory = state.history.slice(-3);
      const inRecentHistory = recentHistory.some(
        (track) => track._id === trackToAdd._id
      );

      if (!exists && !inRecentHistory) {
        state.queue.unshift(trackToAdd);

        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },
    addToQueue: (state, action: PayloadAction<Track>) => {
      const trackToAdd = action.payload;

      if (state.currentTrack && state.currentTrack._id === trackToAdd._id) {
        return;
      }

      const exists = state.queue.some((track) => track._id === trackToAdd._id);
      const recentHistory = state.history.slice(-3);
      const inRecentHistory = recentHistory.some(
        (track) => track._id === trackToAdd._id
      );

      if (!exists && !inRecentHistory) {
        state.queue.push(trackToAdd);

        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },
    removeFromQueue: (state, action: PayloadAction<{ _id: string }>) => {
      const indexToRemove = state.queue.findIndex(
        (track) => track._id === action.payload._id
      );

      if (indexToRemove !== -1) {
        state.queue.splice(indexToRemove, 1);

        if (state.shuffle) {
          state.shuffledIndexes = state.shuffledIndexes
            .filter((index) => index !== indexToRemove)
            .map((index) => (index > indexToRemove ? index - 1 : index));
        }
      }
    },
    removeFromQueueByIndex: (state, action: PayloadAction<number>) => {
      const indexToRemove = action.payload;
      if (indexToRemove >= 0 && indexToRemove < state.queue.length) {
        state.queue.splice(indexToRemove, 1);

        if (state.shuffle) {
          state.shuffledIndexes = state.shuffledIndexes
            .filter((index) => index !== indexToRemove)
            .map((index) => (index > indexToRemove ? index - 1 : index));
        }
      }
    },
    setQueue: (
      state,
      action: PayloadAction<{ tracks: Track[]; startIndex?: number }>
    ) => {
      const { tracks, startIndex = 0 } = action.payload;

      if (startIndex >= 0 && startIndex < tracks.length) {
        state.currentTrack = tracks[startIndex];

        const tracksAfterStart = tracks.slice(startIndex + 1);
        state.queue = filterDuplicateTracks(
          tracksAfterStart,
          state.currentTrack,
          state.history
        );

        const tracksBeforeStart = tracks.slice(0, startIndex);
        tracksBeforeStart.forEach((track) => {
          const lastTrack = state.history[state.history.length - 1];
          if (!lastTrack || lastTrack._id !== track._id) {
            state.history.push(track);
          }
        });

        if (state.history.length > 50) {
          state.history = state.history.slice(-50);
        }
      } else {
        state.queue = filterDuplicateTracks(
          tracks,
          state.currentTrack,
          state.history
        );
        state.currentTrack = null;
      }

      state.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
      state.originalQueue = [...state.queue];

      if (state.shuffle && state.queue.length > 0) {
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      } else {
        state.shuffledIndexes = [];
      }
    },
    setQueueWithDuplicateCheck: (
      state,
      action: PayloadAction<{ tracks: Track[] }>
    ) => {
      const { tracks } = action.payload;

      state.queue = filterDuplicateTracks(
        tracks,
        state.currentTrack,
        state.history
      );

      state.originalQueue = [...state.queue];

      if (state.shuffle && state.queue.length > 0) {
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      } else {
        state.shuffledIndexes = [];
      }
    },
    clearQueue: (state) => {
      state.queue = [];
      state.currentIndex = 0;
      state.shuffledIndexes = [];
      state.originalQueue = [];
    },
    addToHistory: (state, action: PayloadAction<Track>) => {
      const lastTrack = state.history[state.history.length - 1];
      if (!lastTrack || lastTrack._id !== action.payload._id) {
        state.history.push(action.payload);
      }

      if (state.history.length > 50) {
        state.history.shift();
      }
    },
    removeFromHistory: (state) => {
      state.history.pop();
    },
    clearHistory: (state) => {
      state.history = [];
    },
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;

      if (state.shuffle && state.queue.length > 0) {
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      } else {
        state.shuffledIndexes = [];
        if (state.originalQueue.length > 0) {
          state.queue = [...state.originalQueue];
        }
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
    removeShuffledIndex: (state, action: PayloadAction<number>) => {
      const indexToRemove = action.payload;
      if (indexToRemove >= 0 && indexToRemove < state.shuffledIndexes.length) {
        state.shuffledIndexes.splice(indexToRemove, 1);
      }
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

        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    insertInQueue: (
      state,
      action: PayloadAction<{ track: Track; position: number }>
    ) => {
      const { track, position } = action.payload;
      const safePosition = Math.max(0, Math.min(position, state.queue.length));
      state.queue.splice(safePosition, 0, track);

      if (state.shuffle) {
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      }
    },
    playNext: (state, action: PayloadAction<Track>) => {
      const trackToAdd = action.payload;

      if (state.currentTrack && state.currentTrack._id === trackToAdd._id) {
        return;
      }

      const exists = state.queue.some((track) => track._id === trackToAdd._id);
      const recentHistory = state.history.slice(-3);
      const inRecentHistory = recentHistory.some(
        (track) => track._id === trackToAdd._id
      );

      if (!exists && !inRecentHistory) {
        state.queue.unshift(trackToAdd);

        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },
  },
});

/**
 * Filters duplicate tracks from a track list
 * @param tracks - Tracks to filter
 * @param currentTrack - Currently playing track
 * @param history - Playback history
 * @returns Filtered tracks without duplicates
 */
function filterDuplicateTracks(
  tracks: Track[],
  currentTrack: Track | null,
  history: Track[]
): Track[] {
  const excludeIds = new Set<string>();

  if (currentTrack) {
    excludeIds.add(currentTrack._id);
  }

  const recentHistory = history.slice(-5);
  recentHistory.forEach((track) => {
    excludeIds.add(track._id);
  });

  const filtered = tracks.filter((track) => !excludeIds.has(track._id));

  const seen = new Set<string>();
  const deduped = filtered.filter((track) => {
    if (seen.has(track._id)) {
      return false;
    }
    seen.add(track._id);
    return true;
  });

  return deduped;
}

/**
 * Generates shuffled indexes using Fisher-Yates algorithm
 * @param length - Length of array to shuffle
 * @param currentIndex - Index to exclude from shuffle
 * @returns Array of shuffled indexes
 */
function generateShuffledIndexes(
  length: number,
  currentIndex: number
): number[] {
  const indexes = Array.from({ length }, (_, i) => i).filter(
    (i) => i !== currentIndex
  );

  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }

  return indexes;
}

export const {
  setQueueOpen,
  setCurrentTrackInQueue,
  addToQueue,
  addToQueueFirst,
  removeFromQueue,
  removeFromQueueByIndex,
  setQueue,
  setQueueWithDuplicateCheck,
  clearQueue,
  addToHistory,
  removeFromHistory,
  clearHistory,
  toggleShuffle,
  toggleRepeat,
  setRepeat,
  removeShuffledIndex,
  reorderQueue,
  setCurrentIndex,
  insertInQueue,
  playNext,
} = queueSlice.actions;

export default queueSlice.reducer;