import { createSlice } from "@reduxjs/toolkit";

const initialState = false;

export const isGenreSelectOpenSlice = createSlice({
    name: "isGenreSelectOpen",
    initialState,
    reducers: {
        setIsGenreSelectOpen: (state, action) => action.payload
    },
});

export const { setIsGenreSelectOpen } = isGenreSelectOpenSlice.actions;

export default isGenreSelectOpenSlice.reducer;