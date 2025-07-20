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
  queue: [], //"Next up" - треки после текущего
  currentIndex: 0,
  history: [],
  shuffle: false,
  repeat: "off",
  shuffledIndexes: [],
  // Новые поля для системы как в Spotify
  currentTrack: null, // Текущий играющий трек (отдельно от очереди)
  originalQueue: [], // Оригинальная очередь до shuffle
};

// Новый thunk для воспроизведения трека (как в Spotify)
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

    // Добавляем текущий трек в историю ПЕРЕД переключением
    if (currentTrack) {
      dispatch(addToHistory(currentTrack));
    }

    if (contextTracks && contextTracks.length > 0) {
      // Если есть контекст и startIndex, используем setQueue
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

      // Если есть конкретный трек для воспроизведения
      if (track) {
        dispatch(setCurrentTrackInQueue(track));
        dispatch(setCurrentTrack(track));

        // Добавляем остальные треки в очередь (исключая текущий)
        const remainingTracks = contextTracks.filter(
          (t) => t._id !== track._id
        );
        dispatch(setQueue({ tracks: remainingTracks }));
      } else {
        // Если трек не указан, берем первый из контекста
        const firstTrack = contextTracks[0];
        dispatch(setCurrentTrackInQueue(firstTrack));
        dispatch(setCurrentTrack(firstTrack));

        const remainingTracks = contextTracks.slice(1);
        dispatch(setQueue({ tracks: remainingTracks }));
      }
    } else if (track) {
      // Если контекста нет, но есть трек
      dispatch(setCurrentTrackInQueue(track));
      dispatch(setCurrentTrack(track));
      dispatch(clearQueue());
    } else {
      // Нет ни трека, ни контекста
      console.warn("playTrackAndQueue called without track or context");
      return null;
    }

    dispatch(setIsPlaying(true));
    return track || (contextTracks && contextTracks[startIndex || 0]) || null;
  }
);

// Новый thunk для обработки окончания трека
export const handleTrackEnd = createAsyncThunk(
  "queue/handleTrackEnd",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue, repeat, currentTrack } = state.queue;

    console.log(
      "Track ended in Redux, repeat mode:",
      repeat,
      "Queue length:",
      queue.length
    );

    // Если повтор одного трека - НЕ добавляем в историю, просто перезапускаем
    if (repeat === "one") {
      console.log("Repeating current track with delay");
      dispatch(setIsPlaying(false));

      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);

      return "repeat_one";
    }

    // Если есть треки в очереди - переходим к следующему
    if (queue.length > 0) {
      console.log("Playing next track from queue");
      dispatch(playNextTrack());
      return "next_track";
    }

    // Если repeat === "all" и есть текущий трек - НЕ добавляем в историю при repeat
    if (repeat === "all" && currentTrack) {
      console.log("Repeat all: restarting from current track");
      dispatch(setIsPlaying(false));
      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
      return "repeat_all";
    }

    // Нет очереди или repeat === "off" - останавливаем
    console.log("No queue or repeat off, stopping playback");
    dispatch(setIsPlaying(false));
    return "stop";
  }
);

export const playNextTrack = createAsyncThunk(
  "queue/playNextTrack",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue, shuffle, repeat, shuffledIndexes, currentTrack } =
      state.queue;

    console.log("playNextTrack called:", {
      queueLength: queue.length,
      currentTrack: currentTrack?.name,
      repeat,
    });

    if (queue.length === 0) {
      // Нет следующих треков
      if (repeat === "all" && currentTrack) {
        // При repeat all НЕ добавляем в историю, просто перезапускаем
        dispatch(setCurrentTrack(currentTrack));
        dispatch(setIsPlaying(true));
        return "repeat_current";
      }
      dispatch(setIsPlaying(false));
      return null;
    }

    let nextTrack: Track;

    if (shuffle && shuffledIndexes.length > 0) {
      // Воспроизводим первый трек из shuffled очереди
      const shuffledIndex = shuffledIndexes[0];
      nextTrack = queue[shuffledIndex];

      // Удаляем этот индекс из shuffled массива
      dispatch(removeShuffledIndex(0));
      // Удаляем трек из очереди
      dispatch(removeFromQueueByIndex(shuffledIndex));
    } else {
      // Обычное последовательное воспроизведение - берем первый трек
      nextTrack = queue[0];
      dispatch(removeFromQueueByIndex(0));
    }

    // ВАЖНО: Добавляем текущий трек в историю ПЕРЕД переключением
    if (currentTrack) {
      console.log("Adding to history:", currentTrack.name);
      dispatch(addToHistory(currentTrack));
    }

    // Устанавливаем новый текущий трек
    dispatch(setCurrentTrackInQueue(nextTrack));
    dispatch(setCurrentTrack(nextTrack));
    dispatch(setIsPlaying(true));

    console.log("Switched to next track:", nextTrack.name);
    return nextTrack;
  }
);

export const playPreviousTrack = createAsyncThunk(
  "queue/playPreviousTrack",
  async (_, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { history, currentTrack, queue } = state.queue;

    console.log("playPreviousTrack called:", {
      historyLength: history.length,
      currentTrack: currentTrack?.name,
      queueLength: queue.length,
    });

    if (history.length === 0) {
      // Нет предыдущих треков - перезапускаем текущий
      if (currentTrack) {
        console.log("No history, restarting current track");
        dispatch(setCurrentTrack(currentTrack));
        dispatch(setIsPlaying(true));
      }
      return null;
    }

    // Берем последний трек из истории
    const previousTrack = history[history.length - 1];
    console.log("Going back to:", previousTrack.name);

    // ВАЖНО: Добавляем текущий трек в НАЧАЛО очереди (не в историю!)
    // Это работает независимо от того, пуста очередь или нет
    if (currentTrack) {
      console.log("Adding current track to front of queue:", currentTrack.name);
      dispatch(addToQueueFirst(currentTrack));
    }

    // Устанавливаем предыдущий трек как текущий
    dispatch(setCurrentTrackInQueue(previousTrack));
    dispatch(setCurrentTrack(previousTrack));

    // Удаляем трек из истории
    dispatch(removeFromHistory());
    dispatch(setIsPlaying(true));

    console.log("Successfully moved to previous track:", previousTrack.name);
    return previousTrack;
  }
);

// Старые thunk'и для совместимости
export const playTrackFromQueue = createAsyncThunk(
  "queue/playTrackFromQueue",
  async (index: number, { dispatch, getState }) => {
    const state = getState() as { queue: QueueState };
    const { queue } = state.queue;

    if (index >= 0 && index < queue.length) {
      const track = queue[index];
      // Используем новую систему
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
    // Используем новую систему
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

    // Новый редьюсер для установки текущего трека в очереди
    setCurrentTrackInQueue: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
    },

    // Добавить трек в начало очереди (Play Next функциональность)
    addToQueueFirst: (state, action: PayloadAction<Track>) => {
      const exists = state.queue.some(
        (track) => track._id === action.payload._id
      );
      if (!exists) {
        state.queue.unshift(action.payload);
        // Обновляем shuffled indexes если нужно
        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },

    // Добавить трек в конец очереди
    addToQueue: (state, action: PayloadAction<Track>) => {
      const exists = state.queue.some(
        (track) => track._id === action.payload._id
      );
      if (!exists) {
        state.queue.push(action.payload);
        // Обновляем shuffled indexes если нужно
        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },

    // Удалить трек из очереди по ID
    removeFromQueue: (state, action: PayloadAction<{ _id: string }>) => {
      const indexToRemove = state.queue.findIndex(
        (track) => track._id === action.payload._id
      );

      if (indexToRemove !== -1) {
        state.queue.splice(indexToRemove, 1);

        // Обновляем shuffled indexes
        if (state.shuffle) {
          state.shuffledIndexes = state.shuffledIndexes
            .filter((index) => index !== indexToRemove)
            .map((index) => (index > indexToRemove ? index - 1 : index));
        }
      }
    },

    // Новый редьюсер для удаления по индексу
    removeFromQueueByIndex: (state, action: PayloadAction<number>) => {
      const indexToRemove = action.payload;
      if (indexToRemove >= 0 && indexToRemove < state.queue.length) {
        state.queue.splice(indexToRemove, 1);

        // Обновляем shuffled indexes
        if (state.shuffle) {
          state.shuffledIndexes = state.shuffledIndexes
            .filter((index) => index !== indexToRemove)
            .map((index) => (index > indexToRemove ? index - 1 : index));
        }
      }
    },

    // Установить всю очередь
    setQueue: (
      state,
      action: PayloadAction<{ tracks: Track[]; startIndex?: number }>
    ) => {
      const { tracks, startIndex = 0 } = action.payload;

      // Если startIndex указан, то трек по этому индексу становится текущим
      if (startIndex >= 0 && startIndex < tracks.length) {
        // Устанавливаем текущий трек
        state.currentTrack = tracks[startIndex];

        // ИСПРАВЛЕНИЕ: В очередь идут только треки ПОСЛЕ startIndex
        state.queue = tracks.slice(startIndex + 1);

        // НОВОЕ: Треки ПЕРЕД startIndex добавляем в историю
        const tracksBeforeStart = tracks.slice(0, startIndex);
        tracksBeforeStart.forEach((track) => {
          // Проверяем, что трек не дублируется в истории
          const lastTrack = state.history[state.history.length - 1];
          if (!lastTrack || lastTrack._id !== track._id) {
            state.history.push(track);
          }
        });

        // Ограничиваем историю 50 треками
        if (state.history.length > 50) {
          state.history = state.history.slice(-50);
        }
      } else {
        // Если startIndex не указан или неверный, просто устанавливаем очередь
        state.queue = tracks;
        state.currentTrack = null;
      }

      state.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

      // Сохраняем оригинальную очередь (только треки после текущего)
      state.originalQueue = [...state.queue];

      // Генерируем shuffled indexes если нужно
      if (state.shuffle && state.queue.length > 0) {
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      } else {
        state.shuffledIndexes = [];
      }
    },

    // Очистить очередь
    clearQueue: (state) => {
      state.queue = [];
      state.currentIndex = 0;
      state.shuffledIndexes = [];
      state.originalQueue = [];
    },

    // Добавить трек в историю
    addToHistory: (state, action: PayloadAction<Track>) => {
      // Проверяем, что трек не дублируется в конце истории
      const lastTrack = state.history[state.history.length - 1];
      if (!lastTrack || lastTrack._id !== action.payload._id) {
        state.history.push(action.payload);
        console.log(
          "Added to history:",
          action.payload.name,
          "Total history:",
          state.history.length
        );
      }

      // Ограничиваем историю 50 треками
      if (state.history.length > 50) {
        state.history.shift();
      }
    },

    // Удалить последний трек из истории
    removeFromHistory: (state) => {
      const removed = state.history.pop();
      console.log(
        "Removed from history:",
        removed?.name,
        "Remaining:",
        state.history.length
      );
    },

    // Очистить историю
    clearHistory: (state) => {
      state.history = [];
      console.log("History cleared");
    },

    // Переключить shuffle
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;

      if (state.shuffle && state.queue.length > 0) {
        // Включаем shuffle - генерируем случайные индексы
        state.shuffledIndexes = generateShuffledIndexes(state.queue.length, 0);
      } else {
        // Выключаем shuffle - восстанавливаем оригинальную очередь
        state.shuffledIndexes = [];
        if (state.originalQueue.length > 0) {
          state.queue = [...state.originalQueue];
        }
      }
    },

    // Переключить repeat
    toggleRepeat: (state) => {
      const modes: Array<"off" | "all" | "one"> = ["off", "all", "one"];
      const currentIndex = modes.indexOf(state.repeat);
      state.repeat = modes[(currentIndex + 1) % modes.length];
    },

    // Установить режим repeat
    setRepeat: (state, action: PayloadAction<"off" | "all" | "one">) => {
      state.repeat = action.payload;
    },

    // Удалить индекс из shuffled массива
    removeShuffledIndex: (state, action: PayloadAction<number>) => {
      const indexToRemove = action.payload;
      if (indexToRemove >= 0 && indexToRemove < state.shuffledIndexes.length) {
        state.shuffledIndexes.splice(indexToRemove, 1);
      }
    },

    // Переместить треки в очереди (drag & drop)
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

        // Обновляем shuffled indexes если нужно
        if (state.shuffle) {
          state.shuffledIndexes = generateShuffledIndexes(
            state.queue.length,
            0
          );
        }
      }
    },

    // Сохранить текущий индекс (для совместимости)
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },

    // Старые редьюсеры для совместимости
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
      // Добавляем трек в начало очереди
      const exists = state.queue.some(
        (track) => track._id === action.payload._id
      );
      if (!exists) {
        state.queue.unshift(action.payload);
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
  setCurrentTrackInQueue,
  addToQueue,
  addToQueueFirst,
  removeFromQueue,
  removeFromQueueByIndex,
  setQueue,
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
