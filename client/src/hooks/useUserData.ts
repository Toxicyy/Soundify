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
 * Custom hook for fetching user data by ID
 * Provides comprehensive state management and error handling
 */
export const useUserData = (userId: string): UseUserDataReturn => {
  // State management
  const [data, setData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and mount state tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Core data fetching function with comprehensive error handling
   */
  const loadUserData = useCallback(async (id: string) => {
    // Input validation
    if (!id?.trim()) {
      setError("Invalid user ID");
      setIsLoading(false);
      return;
    }

    // Cancel previous request to prevent race conditions
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

      // Validate response structure
      if (!responseData || typeof responseData !== "object") {
        throw new Error("Invalid response format");
      }

      // Early return if component unmounted
      if (!isMountedRef.current) return;

      // Extract user data
      const userData = responseData.data || responseData;

      if (!userData || typeof userData !== "object") {
        throw new Error("Invalid user data format");
      }

      // Update state with validated data
      setData(userData);
    } catch (error) {
      // Ignore abort errors (expected behavior)
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (!isMountedRef.current) return;

      // Transform error messages for better UX
      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Provide user-friendly error messages
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

      console.error("User data loading error:", error);
      setError(errorMessage);
      setData(null);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Refetch current data with same parameters
   */
  const refetch = useCallback(() => {
    if (userId) {
      loadUserData(userId);
    }
  }, [userId, loadUserData]);

  // Initial data loading effect
  useEffect(() => {
    if (userId) {
      loadUserData(userId);
    } else {
      // Reset state when no user ID provided
      setData(null);
      setIsLoading(false);
      setError("User ID is required");
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId, loadUserData]);

  // Component lifecycle management
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
