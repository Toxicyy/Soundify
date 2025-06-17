export type TrackData = {
  id: number;
  name: string;
  artist: { _id: string; name: string };
  cover: File | null;
  audio: File | null;
  preview: string | null;
  duration: number;
  genre: string | null;
  tags: string[] | null;
};

export type Track = {
  id: number;
  name: string;
  artist: { _id: string; name: string };
  coverUrl: string;
  audioUrl: string;
  preview: string | null;
  duration: number;
  genre: string | null;
  tags: string[] | null;
  listenCount: number;
  likeCount: number;
  isPublic: boolean;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
};
