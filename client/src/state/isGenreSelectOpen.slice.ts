import { createSlice } from "@reduxjs/toolkit";

const initialState = false;

export const isGenreSelectOpenSlice = createSlice({
    name: "isGenreSelectOpen",
    initialState,
    reducers: {
        setIsGenreSelectOpen: (_state, action) => action.payload
    },
});

export const { setIsGenreSelectOpen } = isGenreSelectOpenSlice.actions;

export default isGenreSelectOpenSlice.reducer;