export type User = {
    name: string;
    username: string;
    email: string;
    password: string;
    status: string;
    avatar?: string;
    playlists?: string[];
    likedSongs?: string[];
    likedPlaylists?: string[];
    likedArtists?: string[];
}