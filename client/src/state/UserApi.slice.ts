import { createApi, fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { User } from "../types/User";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:5000",
  prepareHeaders(headers) {
    const token = localStorage.getItem("token");
    if (!token) {
      // Прерываем запрос, если нет токена
      headers.set('X-Stop', 'true');
    } else {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  // Если нет токена - отклоняем запрос
  if (args.headers?.get('X-Stop')) {
    return { error: { status: 401, data: 'Unauthorized' } };
  }
  return result;
};

export const userApiSlice = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithAuth,
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
