import type { LocalTrack, AlbumData, SaveProgress } from "../types/LocalTrack";

/**
 * API service for batch album creation with SSE progress tracking
 * Handles FormData creation, batch uploads, and real-time progress monitoring
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface BatchAlbumResponse {
  success: boolean;
  data?: {
    sessionId: string;
    message: string;
    progressUrl: string;
    trackCount: number;
    estimatedTime: string;
    albumName?: string;
    artistName?: string;
  };
  error?: string;
}

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Create FormData for batch album creation
 * Properly formats data for server-side processing
 */
export const createBatchFormData = (
  albumData: AlbumData,
  tracks: LocalTrack[]
): FormData => {
  const formData = new FormData();

  // Album metadata
  formData.append("albumName", albumData.name);
  formData.append("albumDescription", albumData.description || "");
  formData.append("albumType", albumData.type);

  if (albumData.releaseDate) {
    formData.append("releaseDate", albumData.releaseDate.toISOString());
  }

  // Album cover
  if (albumData.coverFile) {
    formData.append("albumCover", albumData.coverFile);
  } else {
    throw new Error("Album cover is required");
  }

  // Album genre (auto-determined from tracks)
  if (tracks.length > 0) {
    const genreCounts = tracks.reduce((acc, track) => {
      const genre = track.metadata.genre;
      if (genre) {
        acc[genre] = (acc[genre] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const albumGenre = Object.entries(genreCounts).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )[0]?.[0];

    if (albumGenre) {
      formData.append("albumGenre", albumGenre);
    }
  }

  // Track data as separate form fields (NOT JSON object)
  tracks.forEach((track, arrayIndex) => {
    const formIndex = arrayIndex;

    // Track metadata
    formData.append(`tracks[${formIndex}][name]`, track.metadata.name);
    formData.append(`tracks[${formIndex}][genre]`, track.metadata.genre || "");

    // Track tags (each tag separately)
    track.metadata.tags.forEach((tag) => {
      formData.append(`tracks[${formIndex}][tags]`, tag);
    });

    // Track files
    formData.append(`tracks[${formIndex}][audio]`, track.file);
    formData.append(`tracks[${formIndex}][cover]`, track.coverFile);
  });

  return formData;
};

/**
 * Start batch album creation
 */
export const createBatchAlbum = async (
  albumData: AlbumData,
  tracks: LocalTrack[]
): Promise<BatchAlbumResponse> => {
  try {
    // Validation
    if (!albumData.name || !albumData.name.trim()) {
      throw new Error("Album name is required");
    }

    if (!albumData.coverFile) {
      throw new Error("Album cover is required");
    }

    if (tracks.length < 2) {
      throw new Error("At least 2 tracks are required for an album");
    }

    // Validate each track
    tracks.forEach((track, index) => {
      if (!track.metadata.name || !track.metadata.name.trim()) {
        throw new Error(`Track ${index + 1} name is required`);
      }
      if (!track.file) {
        throw new Error(`Audio file for track ${index + 1} is required`);
      }
      if (!track.coverFile) {
        throw new Error(`Cover image for track ${index + 1} is required`);
      }
    });

    const formData = createBatchFormData(albumData, tracks);
    const token = getAuthToken();

    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const response = await fetch(`${API_BASE_URL}/api/albums/batch`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - browser sets it with boundary for FormData
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;

        if (errorData.details) {
          if (Array.isArray(errorData.details)) {
            errorMessage += `\nDetails: ${errorData.details.join(", ")}`;
          } else {
            errorMessage += `\nDetails: ${errorData.details}`;
          }
        }
      } catch (parseError) {
        const errorText = await response.text().catch(() => "Unknown error");
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Unknown server error");
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
};

/**
 * SSE Progress tracker for real-time updates
 * Handles connection management and automatic reconnection
 */
export class BatchProgressTracker {
  private eventSource: EventSource | null = null;
  private sessionId: string;
  private onProgress: (progress: SaveProgress) => void;
  private onComplete: (success: boolean, message?: string) => void;
  private onError: (error: string) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(
    sessionId: string,
    onProgress: (progress: SaveProgress) => void,
    onComplete: (success: boolean, message?: string) => void,
    onError: (error: string) => void
  ) {
    this.sessionId = sessionId;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  /**
   * Start listening to progress updates
   */
  start(): void {
    if (this.eventSource) {
      this.stop();
    }

    const token = getAuthToken();
    if (!token) {
      this.onError("Authentication required for progress tracking");
      return;
    }

    const url = `${API_BASE_URL}/api/albums/batch/progress/${
      this.sessionId
    }?token=${encodeURIComponent(token)}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
          this.onError("Failed to parse progress data");
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("SSE error:", error);

        if (this.eventSource?.readyState === EventSource.CLOSED) {
          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;

            setTimeout(() => {
              this.start();
            }, 2000 * this.reconnectAttempts);
          } else {
            this.onError(
              "Connection lost. Please refresh the page and try again."
            );
          }
        }
      };
    } catch (error) {
      console.error("Failed to create SSE connection:", error);
      this.onError("Failed to start progress tracking");
    }
  }

  /**
   * Handle SSE messages
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case "connected":
        break;

      case "progress":
        if (data.data) {
          this.onProgress(data.data);
        }
        break;

      case "finished":
        const success = data.status === "completed";
        this.onComplete(success, data.message);
        this.stop();
        break;

      case "error":
        this.onError(data.message || "Unknown error occurred");
        this.stop();
        break;

      default:
        console.warn("Unknown SSE message type:", data.type, data);
    }
  }

  /**
   * Stop listening to progress updates
   */
  stop(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    if (!this.eventSource) return "not_connected";

    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return "connecting";
      case EventSource.OPEN:
        return "open";
      case EventSource.CLOSED:
        return "closed";
      default:
        return "unknown";
    }
  }
}

/**
 * Cancel batch creation
 */
export const cancelBatchCreation = async (
  sessionId: string
): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return false;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/albums/batch/${sessionId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Cancel request failed:", errorData);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Cancel batch creation failed:", error);
    return false;
  }
};

/**
 * Get progress status (REST alternative to SSE)
 */
export const getBatchProgress = async (
  sessionId: string
): Promise<SaveProgress | null> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/albums/batch/status/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Session not found
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data.progress : null;
  } catch (error) {
    console.error("Get batch progress failed:", error);
    return null;
  }
};
