import { ApiResponse } from "../utils/responses.js";
import UserService from "../services/UserService.js";

export const addLikedSong = async (req, res) => {
    try{
        const { userId, songId } = req.params;
        await UserService.addLikedSong(userId, songId);
        res.json(ApiResponse.success("Liked song added"));
    }catch(err){
        res.json(ApiResponse.error(err.message));
    }
}

export const removeLikedSong = async(req, res) => {
    try{
        const { userId, songId } = req.params;
        await UserService.removeLikedSong(userId, songId);
        res.json(ApiResponse.success("Liked song removed"));
    }catch(err){
        res.json(ApiResponse.error(err.message));
    }
}

export const getLikedSongs = async(req, res) => {
    try{
        const { userId } = req.params;
        const likedSongs = await UserService.getLikedSongs(userId);
        res.json(ApiResponse.success("Liked songs retrieved", likedSongs));
    }catch(err){
        res.json(ApiResponse.error(err.message));
    }
}