import { createSlice } from "@reduxjs/toolkit";
import type { Token } from "../types/Token";

const initialState: Token = {
  access_token: "",
  expires_in: 0,
  token_type: "",
};

const tokenSlice = createSlice({
  name: "token",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.access_token = action.payload.access_token;
      state.expires_in = action.payload.expires_in;
      state.token_type = action.payload.token_type;
    },
  },
});

export const { setToken } = tokenSlice.actions;
export default tokenSlice.reducer;