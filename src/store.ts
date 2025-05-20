import { configureStore } from "@reduxjs/toolkit";
import queueOpenReducer from "./state/QueseOpen.slice";
import tokenReducer from "./state/Token.slice";
export const store = configureStore({
    reducer: {
        queueOpen: queueOpenReducer,
        token: tokenReducer,
    },
})

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
