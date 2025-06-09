import { Request, Response } from 'express';
import { Playlist } from '../models/Playlist.model';

export const createPlaylist = async (req: Request, res: Response) => {
  try {
    const { name, userId } = req.body;
    
    const newPlaylist = await Playlist.create({
      name,
      owner: userId,
      tracks: []
    });

    res.status(201).json(newPlaylist);
  } catch (error) {
    res.status(500).json({ message: 'Error creating playlist' });
  }
};
export const getUserPlaylists = async (req: Request, res: Response) => {
  try {
    const playlists = await Playlist.find({ owner: req.params.userId })
      .populate('tracks')
      .exec();

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlists' });
  }
};