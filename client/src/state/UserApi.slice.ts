import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { User } from "../types/User";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders(headers) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const userApiSlice = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUser: builder.query<User, void>({
      query: () => "/api/users/me",
      transformResponse: (response: ApiResponse<User>) => response.data,
      providesTags: ["User"],
    }),
    updateUser: builder.mutation<User, User>({
      query: (user) => ({
        url: "/auth/update/user",
        method: "PUT",
        body: user,
      }),
      transformResponse: (response: ApiResponse<User>) => response.data,
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useGetUserQuery, useUpdateUserMutation } = userApiSlice;
