import { Schema, model } from 'mongoose';

interface IPlaylist {
  name: string;
  owner: Schema.Types.ObjectId;
  tracks: Schema.Types.ObjectId[];
  isPublic: boolean;
}

const playlistSchema = new Schema<IPlaylist>({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tracks: [{ type: Schema.Types.ObjectId, ref: 'Track' }],
  isPublic: { type: Boolean, default: false }
}, { timestamps: true });

export const Playlist = model<IPlaylist>('Playlist', playlistSchema);