import { useEffect} from "react";
import Header from "../components/likedSongs/Header";
import MainMenu from "../components/likedSongs/MainMenu";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useLikedTracksLoader } from "../hooks/useLikedTracksLoader";

export default function LikedSongs() {
  const { data: user, isFetching } = useGetUserQuery();
  const { isLoading, likedTracks, loadLikedTracks } = useLikedTracksLoader();

  useEffect(() => {
    if (user?._id && !isFetching) {
      loadLikedTracks(user._id);
    }
  }, [user, isFetching]);

  return (
    <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
      <Header tracks={likedTracks} />
      <div className="flex-1 min-h-0">
        <MainMenu tracks={likedTracks} loading={isLoading} />
      </div>
    </div>
  );
}
