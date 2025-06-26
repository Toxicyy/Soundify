import { useEffect, useState } from "react";
import Header from "../components/likedSongs/Header";
import MainMenu from "../components/likedSongs/MainMenu";
import { useGetUserQuery } from "../state/UserApi.slice";
import type { Track } from "../types/TrackData";

export default function LikedSongs() {
  const { data: user, isFetching } = useGetUserQuery();
  const [tracks, setTracks] = useState<Track[]>([]);
  const getLikedTracks = async () => {
    const response = await fetch(
      `http://localhost:5000/api/users/${user?._id}/liked-songs`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const data = await response.json();
    setTracks(data.data);
  };
  useEffect(() => {
    if (!isFetching) {
      getLikedTracks();
    }
  }, [isFetching]);
  return (
    <div className="h-screen w-full mainMenu pl-[22vw] flex flex-col gap-5 pr-[2vw]">
      <Header tracks={tracks} />
      <MainMenu tracks={tracks} />
    </div>
  );
}
