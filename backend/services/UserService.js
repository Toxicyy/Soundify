import User from "../models/User.model.js";
import TrackService from "./TrackService.js";

class UserService{
    async addLikedSong(userId, songId){
        try{
            const user = await User.findByIdAndUpdate(
                userId,
                { $addToSet: { likedSongs: songId } },
                { new: true }
            );
            return user;
        }
        catch(err){
            console.log(err)
        }
    }
    async removeLikedSong(userId, songId){
        try{
            const user = await User.findByIdAndUpdate(
                userId,
                { $pull: { likedSongs: songId } },
                { new: true }
            );
            return user;
        }
        catch(err){
            console.log(err)
        }
    }

    async getLikedSongs(userId){
        try{
            const user = await User.findById(userId).populate("likedSongs");
            const likedTracks = [];
            for(let i = 0; i < user.likedSongs.length; i++){
                likedTracks.push(await TrackService.getTrackById(user.likedSongs[i]));
            }
            return likedTracks
        }
        catch(err){
            console.log(err)
        }
    }
}

export default new UserService();