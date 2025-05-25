import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
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
    status: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
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

const User = model('User', userSchema);

export default User;
