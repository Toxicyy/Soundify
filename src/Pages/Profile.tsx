import { useLocation } from "react-router-dom";
import { useUserData } from "../hooks/useUserData";
import Header from "../components/Profile/Header";
import Anonym from "../images/User/Anonym.jpg";
import MainMenu from "../components/Profile/MainMenu";
import { useGetUserQuery } from "../state/UserApi.slice";

export default function Profile() {
  const location = useLocation();
  const userId = location.pathname.split("/")[2];
  const { data, isLoading, error, refetch, hasData } = useUserData(userId);
  const {data: user } = useGetUserQuery();

  return (
    <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
      <Header
        imageSrc={data?.avatar || Anonym}
        username={data?.username || ""}
        isLoading={isLoading}
        playlists={data?.playlists || []}
        likedArtists={data?.likedArtists || []}
      />
      <div className="flex-1 min-h-0">
        <MainMenu
          playlists={data?.playlists || []}
          isLoading={isLoading}
          likedPlaylists={data?.likedPlaylists || []}
          likedArtists={data?.likedArtists || []}
          access={data?._id === user?._id || user?.status === "ADMIN"}
        />
      </div>
    </div>
  );
}
