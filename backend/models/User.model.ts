import { Schema, model } from "mongoose";

interface IUser {
    username: string;
    email: string;
    password: string;
    playlists: Schema.Types.ObjectId[];
    likedSongs: Schema.Types.ObjectId[];
    likedPlaylists: Schema.Types.ObjectId[];
    likedArtists: Schema.Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: { 
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    playlists: {
        type: [Schema.Types.ObjectId],
        ref: 'Playlist',
    },
    likedSongs: {
        type: [Schema.Types.ObjectId],
        ref: 'Song',
    },
    likedPlaylists: {
        type: [Schema.Types.ObjectId],
        ref: 'Playlist',
    },
    likedArtists: {
        type: [Schema.Types.ObjectId],
        ref: 'Artist',
    },
}, { timestamps: true });

const User = model<IUser>('User', userSchema);

export default User;
