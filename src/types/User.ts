export type User = {
    name: string;
    username: string;
    email: string;
    avatar: string;
    status: string;
    playlists: string[];
    likedSongs: string[];
    likedPlaylists: string[];
    likedArtists: string[];
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}