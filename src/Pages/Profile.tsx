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
  const { data: currentUser } = useGetUserQuery();

  // Determine access level
  const hasAccess =
    data?._id === currentUser?._id || currentUser?.status === "ADMIN";

  // Error state
  if (error && !isLoading) {
    return (
      <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex items-center justify-center">
        <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-6 max-w-md text-center">
          <svg
            className="h-12 w-12 text-red-400 mx-auto mb-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-xl font-semibold text-white mb-2">
            Error Loading Profile
          </h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-red-100/20 hover:bg-red-100/30 text-red-300 px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
      <Header
        imageSrc={data?.avatar || Anonym}
        username={data?.username || ""}
        isLoading={isLoading}
        playlists={data?.playlists || []}
        likedArtists={data?.likedArtists || []}
      />
      <div className="flex-1 min-h-0">
        <MainMenu userId={userId} isLoading={isLoading} access={hasAccess} />
      </div>
    </div>
  );
}
