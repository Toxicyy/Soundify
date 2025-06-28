export type TrackData = {
  id: string;
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
  _id: string;
  name: string;
  artist: { _id: string; name: string };
  coverUrl: string;
  audioUrl: string;
  album: string | null;
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
