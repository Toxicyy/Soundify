import { configureStore } from "@reduxjs/toolkit";
import queueOpenReducer from "./state/QueseOpen.slice";
import dashboardMenuSliceReducer from "./state/DashboardMenu.slice";
import tokenReducer from "./state/Token.slice";
import { userApiSlice } from "./state/UserApi.slice";
import audioQueueSliceReducer from "./state/AudioQueue.slice";
import currentTrackSliceReducer from "./state/CurrentTrack.slice";
import isGenreSelectOpenSliceReducer from "./state/isGenreSelectOpen.slice";

export const store = configureStore({
  reducer: {
    queueOpen: queueOpenReducer,
    dashboardMenu: dashboardMenuSliceReducer,
    token: tokenReducer,
    userApi: userApiSlice.reducer,
    audioQueue: audioQueueSliceReducer,
    currentTrack: currentTrackSliceReducer,
    isGenreSelectOpen: isGenreSelectOpenSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["audioQueue/addToQueueState"],
        ignoredPaths: ["audioQueue.cover", "audioQueue.queue.0.cover"],
      },
    }).concat(userApiSlice.middleware),
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
