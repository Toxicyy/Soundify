/**
 * Shared types for album creation system
 * Single source of truth for LocalTrack and related interfaces
 */

export interface LocalTrack {
  tempId: string; // Возвращаем tempId - он нужен для React keys и состояния
  index: number; // Числовой индекс для FormData отправки
  file: File;
  metadata: {
    name: string;
    genre: string;
    tags: string[];
  };
  coverFile: File;
  audioUrl: string;
  duration?: number;
}

export interface AlbumData {
  name: string;
  description: string;
  releaseDate: Date | null;
  type: "album" | "ep" | "single";
  coverFile: File | null;
  coverPreview: string | null;
}

// Simplified progress structure matching backend
export interface SaveProgress {
  sessionId: string;
  status: "processing" | "completed" | "failed";
  phase: "album" | "tracks" | "completed";
  message: string;
  albumName: string;

  totalTracks: number;
  currentTrack: number;
  overallProgress: number;
  currentTrackProgress: number;

  tracks: Array<{
    tempId: string; // Для React состояния
    index: number; // For FormData
    name: string;
    status: "pending" | "processing" | "completed" | "failed";
    message?: string;
  }>;
}

// Props interfaces for components
export interface AlbumTracksListProps {
  tracks: LocalTrack[];
  albumData: AlbumData;
  onTrackRemove: (tempId: string) => void;
  onTrackReorder: (fromIndex: number, toIndex: number) => void;
  onTrackEdit: (
    tempId: string,
    updates: Partial<LocalTrack["metadata"]>
  ) => void;
  onAddTrack: () => void;
}

export interface AlbumTrackItemProps {
  track: LocalTrack;
  index: number;
  totalTracks: number;
  onPlay: () => void;
  onRemove: () => void;
  onEdit: (updates: Partial<LocalTrack["metadata"]>) => void;
  onDragStart?: (index: number) => void;
  onDragEnd?: (fromIndex: number, toIndex: number) => void;
  isDragging?: boolean;
  dragOverIndex?: number | null;
}

export interface UploadTrackToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackUpload: (track: LocalTrack) => void;
  existingTracks: LocalTrack[];
}

export interface BatchSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumData: AlbumData;
  tracks: LocalTrack[];
  onSuccess: () => void;
}

export interface EditTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: LocalTrack;
  onSave: (updates: Partial<LocalTrack["metadata"]>) => void;
  trackNumber: number;
  totalTracks: number;
}

export interface AlbumHeaderFormProps {
  albumData: AlbumData;
  onChange: (updates: Partial<AlbumData>) => void;
  suggestedGenre: string;
  tracksCount: number;
}
