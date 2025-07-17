export type User = {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  status: "USER" | "PREMIUM" | "ADMIN";
  playlists: string[];
  likedSongs: string[];
  likedPlaylists: string[];
  likedArtists: string[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};
