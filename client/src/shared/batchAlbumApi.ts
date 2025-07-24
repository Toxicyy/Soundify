import type {
  LocalTrack,
  AlbumData,
  SaveProgress,
} from "../types/LocalTrack";

/**
 * API service for batch album creation with SSE progress tracking
 */

export interface BatchAlbumResponse {
  success: boolean;
  data?: {
    sessionId: string;
    message: string;
    progressUrl: string;
    trackCount: number;
    estimatedTime: string;
  };
  error?: string;
}

/**
 * Create FormData for batch album creation
 */
export const createBatchFormData = (
  albumData: AlbumData,
  tracks: LocalTrack[]
): FormData => {
  const formData = new FormData();

  // Album data
  formData.append("albumName", albumData.name);
  formData.append("albumDescription", albumData.description || "");
  formData.append("albumType", albumData.type);

  if (albumData.releaseDate) {
    formData.append("releaseDate", albumData.releaseDate.toISOString());
  }

  // Album cover
  if (albumData.coverFile) {
    formData.append("albumCover", albumData.coverFile);
  }

  // Determine album genre from tracks
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

  // Tracks data (using index for FormData fields)
  tracks.forEach((track) => {
    const index = track.index;

    // Track metadata
    formData.append(`tracks[${index}][name]`, track.metadata.name);
    formData.append(`tracks[${index}][genre]`, track.metadata.genre || "");
    formData.append(
      `tracks[${index}][tags]`,
      JSON.stringify(track.metadata.tags)
    );

    // Track files
    formData.append(`tracks[${index}][audio]`, track.file);
    formData.append(`tracks[${index}][cover]`, track.coverFile);
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
    const formData = createBatchFormData(albumData, tracks);

    const response = await fetch("http://localhost:5000/api/albums/batch", {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type - let browser set it with boundary for FormData
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
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
    console.error("Batch album creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
};

/**
 * SSE Progress tracker
 */
export class BatchProgressTracker {
  private eventSource: EventSource | null = null;
  private sessionId: string;
  private onProgress: (progress: SaveProgress) => void;
  private onComplete: (success: boolean, message?: string) => void;
  private onError: (error: string) => void;

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

    const token = localStorage.getItem("token");
    const url = `http://localhost:5000/api/albums/batch/progress/${this.sessionId}`;

    // Add authorization header for SSE
    this.eventSource = new EventSource(
      `${url}?token=${encodeURIComponent(token || "")}`
    );

    this.eventSource.onopen = () => {
      console.log("SSE connection opened");
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

      // Check if connection is closed
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.onError("Connection lost. Please try again.");
      } else {
        this.onError("Connection error occurred");
      }
    };
  }

  /**
   * Handle SSE messages
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case "connected":
        console.log("SSE connected:", data.sessionId);
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
        console.warn("Unknown SSE message type:", data.type);
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
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

/**
 * Cancel batch creation
 */
export const cancelBatchCreation = async (
  sessionId: string
): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:5000/api/albums/batch/${sessionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
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
    const response = await fetch(`https://localhost:5000/api/albums/batch/status/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

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
