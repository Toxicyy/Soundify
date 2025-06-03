export type TrackData = {
    id: number;
    name: string;
    artist: string;
    cover: File | null;
    audio: File | null;
    preview: string | null;
};