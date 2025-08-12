/**
 * Queue Management Slice for Music Player
 *
 * This slice manages the music playback queue with functionality similar to Spotify:
 * - Current track management (separate from queue)
 * - Playback history tracking
 * - Three repeat modes: off, all, one
 * - Shuffle functionality
 * - Queue manipulation (add, remove, reorder)
 * - Duplicate prevention system
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
  queue: [], // "Next up" - tracks after current track
  currentIndex: 0,
  history: [], // Previously played tracks
  shuffle: false,
  repeat: "off", // "off" | "all" | "one"
  shuffledIndexes: [], // Shuffled order indexes for queue
  // Spotify-like system fields
  currentTrack: null, // Currently playing track (separate from queue)
  originalQueue: [], // Original queue order before shuffle
};

/**
 * Play a track with optional context (Spotify-like functionality)
 *
 * @param track - Specific track to play (optional)
 * @param contextTracks - Array of tracks providing context (album, playlist, etc.)
 * @param startIndex - Index of track to start from in contextTracks
 *
 * Behavior:
 * - Adds current track to history before switching
 * - Sets up queue with remaining tracks after startIndex
 * - Adds tracks before startIndex to history
 * - Prevents duplicate tracks in queue
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

    // Add current track to history BEFORE switching
    if (currentTrack) {
      dispatch(addToHistory(currentTrack));
    }

    if (contextTracks && contextTracks.length > 0) {
      // If context and startIndex provided, use setQueue
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

      // If specific track provided for playback
      if (track) {
        dispatch(setCurrentTrackInQueue(track));
        dispatch(setCurrentTrack(track));

        // Add remaining tracks to queue (excluding current and duplicates)
        const remainingTracks = contextTracks.filter(
          (t) => t._id !== track._id
        );
        dispatch(setQueueWithDuplicateCheck({ tracks: remainingTracks }));
      } else {
        // If no track specified, take first from context
        const firstTrack = contextTracks[0];
        dispatch(setCurrentTrackInQueue(firstTrack));
        dispatch(setCurrentTrack(firstTrack));

        const remainingTracks = contextTracks.slice(1);
        dispatch(setQueueWithDuplicateCheck({ tracks: remainingTracks }));
      }
    } else if (track) {
      // If no context but track provided
      dispatch(setCurrentTrackInQueue(track));
      dispatch(setCurrentTrack(track));
      dispatch(clearQueue());
    } else {
      // No track or context provided
      console.warn("playTrackAndQueue called without track or context");
      return null;
    }

    dispatch(setIsPlaying(true));
    return track || (contextTracks && contextTracks[startIndex || 0]) || null;
  }
);

/**
 * Handle track end event based on repeat mode
 *
 * Repeat modes:
 * - "off": Play through queue once, stop when finished
 * - "all": Play through queue, then restart from history when queue ends
 * - "one": Repeat current track indefinitely
 */
export const handleTrackEnd = createAsyncThunk(
  "queue/handleTrackEnd",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue, repeat, currentTrack, history } = state.queue;

    // Repeat one track - don't add to history, just restart
    if (repeat === "one") {
      dispatch(setIsPlaying(false));

      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);

      return "repeat_one";
    }

    // If tracks in queue - move to next (for all repeat modes)
    if (queue.length > 0) {
      dispatch(playNextTrack());
      return "next_track";
    }

    // Queue finished - check repeat mode
    if (repeat === "all") {
      // Repeat all mode - restore queue from history
      if (history.length > 0) {

        // Add current track to history before restoring
        if (currentTrack) {
          dispatch(addToHistory(currentTrack));
        }

        // Restore queue from history (except last added track)
        const allHistoryTracks = [...history];
        if (allHistoryTracks.length > 0) {
          // Take first track from history as current
          const firstTrack = allHistoryTracks[0];
          dispatch(setCurrentTrackInQueue(firstTrack));
          dispatch(setCurrentTrack(firstTrack));

          // Remaining tracks go to queue
          const remainingTracks = allHistoryTracks.slice(1);
          dispatch(setQueue({ tracks: remainingTracks }));

          // Clear history since we restored the queue
          dispatch(clearHistory());

          dispatch(setIsPlaying(true));
          return "repeat_all_from_history";
        }
      }

      // If no history but current track exists - repeat only current
      if (currentTrack) {
        dispatch(setIsPlaying(false));
        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
        return "repeat_all_current_only";
      }
    }

    // Mode "off" or no tracks to play - stop
    dispatch(setIsPlaying(false));
    return "stop";
  }
);

/**
 * Move to next track in queue
 *
 * Handles shuffle mode and adds current track to history.
 * If queue is empty, delegates to handleTrackEnd for repeat logic.
 */
export const playNextTrack = createAsyncThunk(
  "queue/playNextTrack",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue, shuffle, shuffledIndexes, currentTrack } =
      state.queue;

    if (queue.length === 0) {
      // No next tracks - delegate to handleTrackEnd
      dispatch(handleTrackEnd());
      return null;
    }

    let nextTrack: Track;

    if (shuffle && shuffledIndexes.length > 0) {
      // Play first track from shuffled queue
      const shuffledIndex = shuffledIndexes[0];
      nextTrack = queue[shuffledIndex];

      // Remove this index from shuffled array
      dispatch(removeShuffledIndex(0));
      // Remove track from queue
      dispatch(removeFromQueueByIndex(shuffledIndex));
    } else {
      // Normal sequential playback - take first track
      nextTrack = queue[0];
      dispatch(removeFromQueueByIndex(0));
    }

    // IMPORTANT: Add current track to history BEFORE switching
    if (currentTrack) {
      dispatch(addToHistory(currentTrack));
    }

    // Set new current track
    dispatch(setCurrentTrackInQueue(nextTrack));
    dispatch(setCurrentTrack(nextTrack));
    dispatch(setIsPlaying(true));

    return nextTrack;
  }
);

/**
 * Move to previous track from history
 *
 * Takes the last track from history and adds current track to front of queue.
 * If no history, restarts current track.
 */
export const playPreviousTrack = createAsyncThunk(
  "queue/playPreviousTrack",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { history, currentTrack } = state.queue;

    if (history.length === 0) {
      // No previous tracks - restart current track
      if (currentTrack) {
        dispatch(setCurrentTrack(currentTrack));
        dispatch(setIsPlaying(true));
      }
      return null;
    }

    // Take last track from history
    const previousTrack = history[history.length - 1];

    // IMPORTANT: Add current track to FRONT of queue (not to history!)
    // This works regardless of whether queue is empty or not
    if (currentTrack) {
      dispatch(addToQueueFirst(currentTrack));
    }

    // Set previous track as current
    dispatch(setCurrentTrackInQueue(previousTrack));
    dispatch(setCurrentTrack(previousTrack));

    // Remove track from history
    dispatch(removeFromHistory());
    dispatch(setIsPlaying(true));

    return previousTrack;
  }
);

// Legacy thunks for backward compatibility

/**
 * Play track from queue by index (legacy)
 */
export const playTrackFromQueue = createAsyncThunk(
  "queue/playTrackFromQueue",
  async (index: number, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue } = state.queue;

    if (index >= 0 && index < queue.length) {
      const track = queue[index];
      // Use new system
      dispatch(
        playTrackAndQueue({ track, contextTracks: queue, startIndex: index })
      );
      return track;
    }
    return null;
  }
);

/**
 * Set queue and start playing (legacy)
 */
export const setQueueAndPlay = createAsyncThunk(
  "queue/setQueueAndPlay",
  async (
    { tracks, startIndex = 0 }: { tracks: Track[]; startIndex?: number },
    { dispatch }
  ) => {
    // Use new system
    dispatch(playTrackAndQueue({ contextTracks: tracks, startIndex }));
    return { tracks, startIndex };
  }
);

export const queueSlice = createSlice({
  name: "queue",
  initialState,
  reducers: {
    /**
     * Toggle queue panel visibility
     */
    setQueueOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },

    /**
     * Set current playing track (separate from queue)
     */
    setCurrentTrackInQueue: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
    },

    /**
     * Add track to front of queue (Play Next functionality)
     * Prevents duplicates with current track, existing queue, and recent history
     */
    addToQueueFirst: (state, action: PayloadAction<Track>) => {
      const trackToAdd = action.payload;

      // Check if track is currently playing
      if (state.currentTrack && state.currentTrack._id === trackToAdd._id) {
        return;
      }

      // Check if track already exists in queue
      const exists = state.queue.some((track) => track._id === trackToAdd._id);

      // Check if track is in recent history (last 3 tracks)
      const recentHistory = state.history.slice(-3);
      const inRecentHistory = recentHistory.some(
        (track) => track._id === trackToAdd._id
      );

      if (!exists && !inRecentHistory) {
        state.queue.unshift(trackToAdd);

        // Update shuffled indexes if needed
        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },

    /**
     * Add track to end of queue
     * Prevents duplicates with current track, existing queue, and recent history
     */
    addToQueue: (state, action: PayloadAction<Track>) => {
      const trackToAdd = action.payload;

      // Check if track is currently playing
      if (state.currentTrack && state.currentTrack._id === trackToAdd._id) {
        return;
      }

      // Check if track already exists in queue
      const exists = state.queue.some((track) => track._id === trackToAdd._id);

      // Check if track is in recent history (last 3 tracks)
      const recentHistory = state.history.slice(-3);
      const inRecentHistory = recentHistory.some(
        (track) => track._id === trackToAdd._id
      );

      if (!exists && !inRecentHistory) {
        state.queue.push(trackToAdd);

        // Update shuffled indexes if needed
        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },

    /**
     * Remove track from queue by ID
     */
    removeFromQueue: (state, action: PayloadAction<{ _id: string }>) => {
      const indexToRemove = state.queue.findIndex(
        (track) => track._id === action.payload._id
      );

      if (indexToRemove !== -1) {
        state.queue.splice(indexToRemove, 1);

        // Update shuffled indexes
        if (state.shuffle) {
          state.shuffledIndexes = state.shuffledIndexes
            .filter((index) => index !== indexToRemove)
            .map((index) => (index > indexToRemove ? index - 1 : index));
        }
      }
    },

    /**
     * Remove track from queue by index
     */
    removeFromQueueByIndex: (state, action: PayloadAction<number>) => {
      const indexToRemove = action.payload;
      if (indexToRemove >= 0 && indexToRemove < state.queue.length) {
        state.queue.splice(indexToRemove, 1);

        // Update shuffled indexes
        if (state.shuffle) {
          state.shuffledIndexes = state.shuffledIndexes
            .filter((index) => index !== indexToRemove)
            .map((index) => (index > indexToRemove ? index - 1 : index));
        }
      }
    },

    /**
     * Set entire queue with optional start index and duplicate checking
     *
     * If startIndex is provided:
     * - Track at startIndex becomes current
     * - Tracks after startIndex go to queue (filtered for duplicates)
     * - Tracks before startIndex are added to history
     */
    setQueue: (
      state,
      action: PayloadAction<{ tracks: Track[]; startIndex?: number }>
    ) => {
      const { tracks, startIndex = 0 } = action.payload;

      // If startIndex specified, track at that index becomes current
      if (startIndex >= 0 && startIndex < tracks.length) {
        // Set current track
        state.currentTrack = tracks[startIndex];

        // FIXED: Queue gets only tracks AFTER startIndex (filtered for duplicates)
        const tracksAfterStart = tracks.slice(startIndex + 1);
        state.queue = filterDuplicateTracks(
          tracksAfterStart,
          state.currentTrack,
          state.history
        );

        // NEW: Add tracks BEFORE startIndex to history
        const tracksBeforeStart = tracks.slice(0, startIndex);
        tracksBeforeStart.forEach((track) => {
          // Check that track doesn't duplicate in history
          const lastTrack = state.history[state.history.length - 1];
          if (!lastTrack || lastTrack._id !== track._id) {
            state.history.push(track);
          }
        });

        // Limit history to 50 tracks
        if (state.history.length > 50) {
          state.history = state.history.slice(-50);
        }
      } else {
        // If startIndex not specified or invalid, just set queue with filtering
        state.queue = filterDuplicateTracks(
          tracks,
          state.currentTrack,
          state.history
        );
        state.currentTrack = null;
      }

      state.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

      // Save original queue (only tracks after current)
      state.originalQueue = [...state.queue];

      // Generate shuffled indexes if needed
      if (state.shuffle && state.queue.length > 0) {
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      } else {
        state.shuffledIndexes = [];
      }
    },

    /**
     * Set queue with duplicate checking (new reducer)
     */
    setQueueWithDuplicateCheck: (
      state,
      action: PayloadAction<{ tracks: Track[] }>
    ) => {
      const { tracks } = action.payload;

      // Filter out duplicates
      state.queue = filterDuplicateTracks(
        tracks,
        state.currentTrack,
        state.history
      );

      // Save original queue
      state.originalQueue = [...state.queue];

      // Generate shuffled indexes if needed
      if (state.shuffle && state.queue.length > 0) {
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      } else {
        state.shuffledIndexes = [];
      }
    },

    /**
     * Clear entire queue
     */
    clearQueue: (state) => {
      state.queue = [];
      state.currentIndex = 0;
      state.shuffledIndexes = [];
      state.originalQueue = [];
    },

    /**
     * Add track to playback history
     */
    addToHistory: (state, action: PayloadAction<Track>) => {
      // Check that track doesn't duplicate at end of history
      const lastTrack = state.history[state.history.length - 1];
      if (!lastTrack || lastTrack._id !== action.payload._id) {
        state.history.push(action.payload);
      }

      // Limit history to 50 tracks
      if (state.history.length > 50) {
        state.history.shift();
      }
    },

    /**
     * Remove last track from history
     */
    removeFromHistory: (state) => {
      state.history.pop();
    },

    /**
     * Clear entire playback history
     */
    clearHistory: (state) => {
      state.history = [];
    },

    /**
     * Toggle shuffle mode on/off
     *
     * When enabling shuffle:
     * - Generates random indexes for current queue
     * When disabling shuffle:
     * - Restores original queue order
     */
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;

      if (state.shuffle && state.queue.length > 0) {
        // Enable shuffle - generate random indexes
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      } else {
        // Disable shuffle - restore original queue
        state.shuffledIndexes = [];
        if (state.originalQueue.length > 0) {
          state.queue = [...state.originalQueue];
        }
      }
    },

    /**
     * Toggle repeat mode: off -> all -> one -> off
     */
    toggleRepeat: (state) => {
      const modes: Array<"off" | "all" | "one"> = ["off", "all", "one"];
      const currentIndex = modes.indexOf(state.repeat);
      state.repeat = modes[(currentIndex + 1) % modes.length];
    },

    /**
     * Set specific repeat mode
     */
    setRepeat: (state, action: PayloadAction<"off" | "all" | "one">) => {
      state.repeat = action.payload;
    },

    /**
     * Remove index from shuffled array (used during shuffle playback)
     */
    removeShuffledIndex: (state, action: PayloadAction<number>) => {
      const indexToRemove = action.payload;
      if (indexToRemove >= 0 && indexToRemove < state.shuffledIndexes.length) {
        state.shuffledIndexes.splice(indexToRemove, 1);
      }
    },

    /**
     * Reorder tracks in queue (drag & drop functionality)
     */
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

        // Update shuffled indexes if needed
        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },

    /**
     * Set current index (for backward compatibility)
     */
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },

    // Legacy reducers for backward compatibility

    /**
     * Insert track at specific position in queue
     */
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

    /**
     * Add track to front of queue (legacy - same as addToQueueFirst)
     */
    playNext: (state, action: PayloadAction<Track>) => {
      const trackToAdd = action.payload;

      // Check if track is currently playing
      if (state.currentTrack && state.currentTrack._id === trackToAdd._id) {
        return;
      }

      // Check if track already exists in queue
      const exists = state.queue.some((track) => track._id === trackToAdd._id);

      // Check if track is in recent history (last 3 tracks)
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
 * Utility function to filter duplicate tracks from a track list
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

  // Add current track ID
  if (currentTrack) {
    excludeIds.add(currentTrack._id);
  }

  // Add recent history IDs (last 5 tracks)
  const recentHistory = history.slice(-5);
  recentHistory.forEach((track) => {
    excludeIds.add(track._id);
  });

  // Filter tracks
  const filtered = tracks.filter((track) => !excludeIds.has(track._id));

  // Remove duplicates within the filtered list itself
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
 * Utility function to generate shuffled indexes using Fisher-Yates algorithm
 *
 * @param length - Length of array to shuffle
 * @param currentIndex - Index to exclude from shuffle (current track)
 * @returns Array of shuffled indexes
 */
function generateShuffledIndexes(
  length: number,
  currentIndex: number
): number[] {
  const indexes = Array.from({ length }, (_, i) => i).filter(
    (i) => i !== currentIndex
  );

  // Fisher-Yates shuffle algorithm
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }

  return indexes;
}

// Export all actions
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
