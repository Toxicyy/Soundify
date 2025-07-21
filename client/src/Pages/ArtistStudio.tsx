import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArtistStudioHeader from "../components/ArtistStudio/ArtistStudioHeader";
import { useArtistData } from "../hooks/useArtistData";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useNotification } from "../hooks/useNotification";

// Локальный интерфейс для компонентов ArtistStudio (совместимый с модалками)
interface LocalArtist {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  followerCount: number;
  isVerified: boolean;
  createdAt: string;
  genres: string[];
  socialLinks: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
}

export default function ArtistStudio() {
  const navigate = useNavigate();
  const { showWarning } = useNotification();
  const { data: user, isLoading: isUserLoading } = useGetUserQuery();

  const [artistData, setArtistData] = useState<LocalArtist | null>(null);
  const [tracksCount, setTracksCount] = useState(0);

  // Получаем данные артиста на основе artistProfile пользователя
  const {
    data: artist,
    loading: artistLoading,
    error: artistError,
    refetch: refetchArtist,
  } = useArtistData(user?.artistProfile || "");

  // Проверка доступа - только артисты могут посещать эту страницу
  useEffect(() => {
    if (!isUserLoading && user && !user.artistProfile) {
      showWarning("You need to become an artist first to access Artist Studio");
      navigate("/become-an-artist");
      return;
    }
  }, [user, isUserLoading, navigate, showWarning]);

  // Обновляем локальные данные артиста при получении данных с сервера
  useEffect(() => {
    if (artist) {
      // Преобразуем данные из типа ArtistType в LocalArtist
      const formattedArtist: LocalArtist = {
        _id: artist._id,
        name: artist.name,
        avatar: artist.avatar,
        bio: artist.bio,
        followerCount: artist.followerCount || 0,
        isVerified: artist.isVerified || false,
        createdAt: artist.createdAt,
        genres: Array.isArray(artist.genres) ? artist.genres : [],
        socialLinks: {
          spotify: artist.socialLinks?.spotify,
          instagram: artist.socialLinks?.instagram,
          twitter: artist.socialLinks?.twitter,
        },
      };

      setArtistData(formattedArtist);
      loadTracksCount(artist._id);
    }
  }, [artist]);

  // Функция для загрузки количества треков артиста
  const loadTracksCount = async (artistId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/artists/${artistId}/tracks?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTracksCount(data.total || data.data?.length || 0);
      }
    } catch (error) {
      console.error("Error loading tracks count:", error);
      setTracksCount(0);
    }
  };

  // Обработчик обновления данных артиста
  const handleArtistUpdate = (updatedFields: Partial<LocalArtist>) => {
    if (artistData) {
      setArtistData((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }
  };

  // Показываем ошибку если артист не найден
  if (artistError) {
    return (
      <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-white text-xl font-semibold mb-2">
              Artist Studio Error
            </h2>
            <p className="text-white/70 text-sm mb-1">{artistError}</p>
            <p className="text-white/50 text-xs">
              Please try refreshing the page or contact support
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={refetchArtist}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Retry loading artist"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </button>

            <button
              onClick={() => navigate("/become-an-artist")}
              className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/20"
              aria-label="Become an artist"
            >
              Become an Artist
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Показываем loading state
  if (isUserLoading || artistLoading || !artistData) {
    return (
      <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
        <ArtistStudioHeader
          artist={{
            _id: "",
            name: "",
            avatar: "",
            bio: "",
            followerCount: 0,
            isVerified: false,
            createdAt: "",
            genres: [],
            socialLinks: {},
          }}
          tracksCount={0}
          isLoading={true}
        />

        {/* Skeleton для будущего контента */}
        <div className="flex-1 space-y-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
            <div className="space-y-4">
              <div className="h-6 bg-white/20 rounded-lg w-48 animate-pulse"></div>
              <div className="h-4 bg-white/15 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-white/15 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
              <div className="h-6 bg-white/20 rounded-lg w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/15 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-white/15 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-white/15 rounded w-4/6 animate-pulse"></div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
              <div className="h-6 bg-white/20 rounded-lg w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/15 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-white/15 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-white/15 rounded w-4/6 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Основной рендер страницы
  return (
    <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
      <ArtistStudioHeader
        artist={artistData}
        tracksCount={tracksCount}
        isLoading={false}
        onArtistUpdate={handleArtistUpdate}
      />

      {/* Здесь будет основной контент Dashboard */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="space-y-6">
          {/* Заглушка для будущего Dashboard контента */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-8 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">
                Dashboard Overview
              </h2>
            </div>
            <p className="text-white/70">
              Welcome to your Artist Studio! Here you can manage your tracks,
              view analytics, and update your profile.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold">Total Tracks</h3>
                <p className="text-2xl font-bold text-green-400">
                  {tracksCount}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold">Followers</h3>
                <p className="text-2xl font-bold text-blue-400">
                  {artistData.followerCount.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold">Status</h3>
                <p className="text-2xl font-bold text-purple-400">
                  {artistData.isVerified ? "Verified" : "Unverified"}
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder для других секций */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Recent Activity
              </h3>
              <p className="text-white/60">
                Track uploads, follower changes, and more will appear here.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
              <p className="text-white/60">
                Analytics and performance metrics coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
