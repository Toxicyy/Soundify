import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../shared/api";
import type { User } from "../types/User";

interface UseUserDataReturn {
  data: User | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  hasData: boolean;
}

/**
 * Hook for fetching user data by ID
 * Provides comprehensive state management and error handling
 */
export const useUserData = (userId: string): UseUserDataReturn => {
  const [data, setData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadUserData = useCallback(async (id: string) => {
    if (!id?.trim()) {
      setError("Invalid user ID");
      setIsLoading(false);
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.user.getById(id);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid response format - expected JSON");
      }

      const responseData = await response.json();

      if (!responseData || typeof responseData !== "object") {
        throw new Error("Invalid response format");
      }

      if (!isMountedRef.current) return;

      const userData = responseData.data || responseData;

      if (!userData || typeof userData !== "object") {
        throw new Error("Invalid user data format");
      }

      setData(userData);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (!isMountedRef.current) return;

      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        errorMessage = "Network connection error";
      } else if (errorMessage.includes("HTTP 404")) {
        errorMessage = "User not found";
      } else if (errorMessage.includes("HTTP 403")) {
        errorMessage = "Access denied";
      } else if (errorMessage.includes("HTTP 401")) {
        errorMessage = "Authentication required";
      } else if (errorMessage.includes("HTTP 500")) {
        errorMessage = "Server error";
      }

      setError(errorMessage);
      setData(null);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    if (userId) {
      loadUserData(userId);
    }
  }, [userId, loadUserData]);

  useEffect(() => {
    if (userId) {
      loadUserData(userId);
    } else {
      setData(null);
      setIsLoading(false);
      setError("User ID is required");
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId, loadUserData]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    hasData: data !== null,
  };
};
