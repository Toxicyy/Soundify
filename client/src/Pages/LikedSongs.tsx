import { useEffect } from "react";
import Header from "../components/likedSongs/Header";
import MainMenu from "../components/likedSongs/MainMenu";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useLikedTracksLoader } from "../hooks/useLikedTracksLoader";

/**
 * Страница любимых треков с адаптивным дизайном
 * Поддерживает desktop, tablet и mobile layout
 *
 * @returns JSX.Element - Страница со списком любимых треков
 */
export default function LikedSongs() {
  const { data: user, isFetching } = useGetUserQuery();
  const { isLoading, likedTracks, loadLikedTracks } = useLikedTracksLoader();

  /**
   * Загружает любимые треки пользователя при изменении данных
   */
  useEffect(() => {
    if (user?._id && !isFetching) {
      loadLikedTracks(user._id);
    }
  }, [user, isFetching]);

  return (
    <div className="h-screen w-full mainMenu pl-4 xl:pl-[22vw] pr-2 xl:pr-[2vw] md:mb-30 flex flex-col gap-3 md:gap-4 xl:gap-5 pt-3 md:pt-6 mb-35 xl:mb-0">
      {/* Header компонент с адаптивными размерами */}
      <Header tracks={likedTracks} />

      {/* MainMenu компонент занимает оставшееся пространство */}
      <div className="flex-1 min-h-0 mb-2 md:mb-4 xl:mb-5">
        <MainMenu tracks={likedTracks} isLoading={isLoading} />
      </div>
    </div>
  );
}
