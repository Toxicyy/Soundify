// types/Playlist.ts - обновленные типы для плейлиста

import type { Track } from "./TrackData";

export interface Playlist {
  _id: string;
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  coverFileId?: string;
  owner: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  tracks: Track[] | string[]; // Может быть как массив объектов, так и массив ID
  tags: string[];
  category: string;
  privacy: "public" | "private" | "unlisted";
  likeCount: number;
  trackCount: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean;
}

// Для обновления плейлиста через API
export interface PlaylistUpdate {
  name?: string;
  description?: string;
  privacy?: "public" | "private" | "unlisted";
  category?: string;
  tags?: string[];
  cover?: File | null;
}
