import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetUserQuery } from "../../state/UserApi.slice";
import { useNotification } from "../../hooks/useNotification";

/**
 * Home page with artist profile detection
 * Auto-redirects artists to studio, shows welcome for new users
 */
const Home = () => {
  const navigate = useNavigate();
  const { showInfo } = useNotification();
  const {
    data: currentUser,
    isLoading: isUserLoading,
    error,
  } = useGetUserQuery();

  useEffect(() => {
    if (!isUserLoading && currentUser) {
      if (currentUser.artistProfile) {
        showInfo("Welcome back! Redirecting to your Artist Studio...");

        setTimeout(() => {
          navigate("/artist-studio", { replace: true });
        }, 5000);
      }
    }
  }, [currentUser, isUserLoading, navigate, showInfo]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex-1 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-[22vw] xl:pr-[2vw] py-4 sm:py-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
              <p className="text-white/70 text-sm sm:text-base">
                Loading your profile...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex-1 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-[22vw] xl:pr-[2vw] py-4 sm:py-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full bg-red-50/10 border border-red-200/20 rounded-2xl p-6 text-center">
              <h2 className="text-xl font-semibold text-white mb-2">
                Error Loading Profile
              </h2>
              <p className="text-red-300 mb-4">
                Unable to load your profile information.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-100/20 hover:bg-red-100/30 text-red-300 px-4 py-2 rounded-xl transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser?.artistProfile) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex-1 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-[22vw] xl:pr-[2vw] py-4 sm:py-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-white mb-4">
                Welcome Back, Artist!
              </h1>
              <p className="text-white/70 mb-6">
                You already have an artist profile. Redirecting you to your
                Artist Studio...
              </p>

              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500" />
                <span className="text-green-400 text-sm">Redirecting...</span>
              </div>

              <button
                onClick={() => navigate("/artist-studio")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 text-sm"
              >
                Go to Artist Studio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-[22vw] xl:pr-[2vw] py-4 sm:py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Music Platform
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/70 mb-8 max-w-3xl mx-auto">
              Discover amazing music, connect with artists, and share your own
              creations with the world.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate("/discover")}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Discover Music
              </button>

              {currentUser ? (
                <button
                  onClick={() => navigate("/become-artist")}
                  className="w-full sm:w-auto bg-transparent border-2 border-white/20 hover:border-white/40 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 hover:bg-white/5"
                >
                  Become an Artist
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full sm:w-auto bg-transparent border-2 border-white/20 hover:border-white/40 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 hover:bg-white/5"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 py-12">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 text-center hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                Share Your Music
              </h3>
              <p className="text-white/60 text-sm sm:text-base">
                Upload your own tracks as an artist and build your fanbase.
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 sm:p-8 text-center mt-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to Share Your Music?
              </h2>
              <p className="text-white/70 text-base sm:text-lg mb-6 max-w-2xl mx-auto">
                Join thousands of artists who are already sharing their music
                and building their fanbase. Create your artist profile today and
                start your musical journey.
              </p>
              <button
                onClick={() => navigate("/become-artist")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Become an Artist
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
