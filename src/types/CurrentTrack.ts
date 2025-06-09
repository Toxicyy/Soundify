export type CurrentTrackState ={
    currentTrack: {
        name: string,
        artist: string,
        audioUrl: string,
        coverUrl: string,
        listenCount: number,
        createdAt: Date,
    } | null
}