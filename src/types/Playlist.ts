import type { User } from "./User";
import type { Track } from "./TrackData";

export type PlaylistData = {
    name: string;
    description: string;
    cover: File | null;
    tags: string[];
    category: "user" | "featured" | "genre" | "mood" | "activity";
    privacy: "public" | "private" | "unlisted";
    tracks: string[]; // Track IDs for creation
}

export type Playlist = {
    _id: string;
    name: string;
    owner: User;
    description: string;
    coverUrl: string | null;
    coverFileId: string | null;
    tracks: Track[] | string[]; // Can be populated tracks or just IDs
    tags: string[];
    category: "user" | "featured" | "genre" | "mood" | "activity";
    privacy: "public" | "private" | "unlisted";
    isDraft: boolean;
    trackCount: number;
    totalDuration: number; // in seconds
    likeCount: number;
    lastModified: string;
    lastActivity: string;
    version: number;
    createdAt: string;
    updatedAt: string;
}

// Дополнительные типы для работы с плейлистами

export type PlaylistUpdate = Partial<Pick<PlaylistData, 
    'name' | 'description' | 'tags' | 'category' | 'privacy'
>> & {
    cover?: File | null;
    tracks?: string[]; // Для обновления порядка треков
}

// Тип для локальных изменений (без File объектов)
export type PlaylistLocalChanges = Partial<Pick<Playlist, 
    'name' | 'description' | 'tags' | 'category' | 'privacy'
>> & {
    coverUrl?: string | null; // URL вместо File для локального состояния
    tracks?: string[]; // ID треков
}

export type QuickPlaylistResponse = {
    id: string;
    name: string;
    isDraft: boolean;
}

export type PlaylistStats = {
    trackCount: number;
    totalDuration: number;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
}

export type PlaylistSearchResult = {
    _id: string;
    name: string;
    coverUrl: string | null;
    owner: Pick<User, '_id' | 'name'>;
    tags: string[];
    category: string;
    totalDuration: number;
    trackCount: number;
}