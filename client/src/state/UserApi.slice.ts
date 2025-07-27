import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { User } from "../types/User";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const userApiSlice = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000",
    prepareHeaders(headers) {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => {
    return {
      getUser: builder.query<User, void>({
        query: () => "/api/users/me",
        transformResponse: (response: ApiResponse<User>) => response.data,
      }),
      updateUser: builder.mutation<User, User>({
        query: (user) => ({
          url: "/auth/update/user",
          method: "PUT",
          body: user,
        }),
        transformResponse: (response: ApiResponse<User>) => response.data,
      }),
    };
  },
});

export const { useGetUserQuery, useUpdateUserMutation } = userApiSlice;
