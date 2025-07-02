import type { Artist } from "./ArtistData";

export type AlbumData = {
    name: string;
    artist: Artist;
    description: string;
    cover: File | null;
    genre: string[];
}

export type Album = {
    _id: string;
    name: string;
    artist: Artist;
    description: string;
    coverUrl: string;
    genre: string[];
    type: "album" | "ep" | "single";
    releaseDate: string;
    createdAt: string;
    updatedAt: string;
}