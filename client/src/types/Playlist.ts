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
  tracks: Track[] | string[];
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

export interface PlaylistUpdate {
  name?: string;
  description?: string;
  privacy?: "public" | "private" | "unlisted";
  category?: string;
  tags?: string[];
  cover?: File | null;
}
