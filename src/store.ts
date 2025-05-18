import { configureStore } from "@reduxjs/toolkit";
import queueOpenReducer from "./state/QueseOpen.slice";

export const store = configureStore({
    reducer: {
        queueOpen: queueOpenReducer,
    },
})

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
