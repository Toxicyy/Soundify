import { configureStore } from "@reduxjs/toolkit";
import queueOpenReducer from "./state/QueseOpen.slice";
import dashboardMenuSliceReducer from "./state/DashboardMenu.slice";
import tokenReducer from "./state/Token.slice";
import { userApiSlice } from "./state/UserApi.slice";
export const store = configureStore({
  reducer: {
    queueOpen: queueOpenReducer,
    dashboardMenu: dashboardMenuSliceReducer,
    token: tokenReducer,
    userApi: userApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userApiSlice.middleware),
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
