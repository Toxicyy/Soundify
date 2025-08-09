import { useState } from "react";
import Header from "../components/BecomeAnArtist/Header";
import MainMenu from "../components/BecomeAnArtist/MainMenu";
import Anonym from "../images/User/Anonym.jpg";
import { api } from "../shared/api";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useArtistProfileCheck } from "../hooks/useArtistProfileCheck";
import Home from "../components/BecomeAnArtist/Home";

/**
 * Become an Artist Page - Responsive design with authentication
 *
 * RESPONSIVE DESIGN:
 * - Adaptive padding: pl-4 (mobile) to pl-[22vw] (desktop with player)
 * - Mobile-first approach with proper breakpoints
 * - Flexible layout that works on all screen sizes
 * - Touch-optimized form interactions
 *
 * AUTHENTICATION:
 * - Checks user authentication before allowing access
 * - Shows login prompt for unauthenticated users
 * - Handles artist profile creation workflow
 * - Proper error handling and user feedback
 *
 * LAYOUT BREAKPOINTS:
 * - Mobile (< 768px): Full width with minimal padding
 * - Tablet (768px - 1279px): Medium padding with sidebar space
 * - Desktop (>= 1280px): Full sidebar with player (pl-[22vw])
 *
 * FEATURES:
 * - Multi-step artist creation process
 * - Image upload with preview functionality
 * - Social media links integration
 * - Genre selection with validation
 * - Real-time form validation and feedback
 */

export type ArtistCreate = {
  name: string;
  bio: string;
  imageSrc: string;
  imageFile?: File;
  genres: string[];
  socialLinks: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
};

const DEFAULT_ARTIST: ArtistCreate = {
  name: "",
  bio: "",
  imageSrc: Anonym,
  genres: [],
  socialLinks: {},
};

/**
 * Authentication Warning Component
 */
const AuthenticationWarning = () => (
  <div className="min-h-screen w-full flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
      {/* Icon */}
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

      {/* Content */}
      <h1 className="text-2xl font-bold text-white mb-4">Join as an Artist</h1>
      <p className="text-white/70 mb-6 leading-relaxed">
        You need to be logged in to create an artist profile and start sharing
        your music with the world.
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => (window.location.href = "/login")}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
        >
          Sign In to Continue
        </button>
        <button
          onClick={() => (window.location.href = "/register")}
          className="w-full bg-transparent border border-white/20 hover:border-white/40 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
        >
          Create Account
        </button>
      </div>

      {/* Additional info */}
      <p className="text-white/50 text-sm mt-6">
        Ready to share your talent? Join thousands of artists today!
      </p>
    </div>
  </div>
);

export default function BecomeAnArtist() {
  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useGetUserQuery();
  const { refetch } = useGetUserQuery();
  const [artist, setArtist] = useState<ArtistCreate>(DEFAULT_ARTIST);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasArtistProfile } = useArtistProfileCheck();

  if (hasArtistProfile) return <Home />;

  // Check authentication status
  const isAuthenticated = !!currentUser && !isCurrentUserLoading;

  // Show authentication warning for unauthenticated users
  if (!isAuthenticated && !isCurrentUserLoading) {
    return <AuthenticationWarning />;
  }

  // Loading state during auth check
  if (isCurrentUserLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const handleSaveArtist = async (artistData: ArtistCreate) => {
    try {
      const response = await api.artist.becomeAnArtist(artistData);
      const data = await response.json();

      console.log("Saving artist data:", artistData);
      if (!data.success) {
        showError("Failed to create artist profile. Please try again.");
      } else {
        refetch();
        navigate("/");
        showSuccess("Artist profile created successfully!");
      }
    } catch (error) {
      console.error("Failed to save artist:", error);
      showError("Failed to create artist profile. Please try again.");
      throw error;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col mb-30">
      {/* 
        Responsive container with adaptive padding:
        - Mobile: pl-4 pr-4 (no sidebar)
        - Tablet: pl-6 pr-6 (partial sidebar)
        - Desktop: pl-[22vw] pr-[2vw] (full sidebar with player)
      */}
      <div className="flex-1 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-[22vw] xl:pr-[2vw] py-4 sm:py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6">
          {/* Header Section */}
          <div className="w-full">
            <Header
              imageSrc={artist.imageSrc || Anonym}
              localChanges={artist}
              setLocalChanges={(changes) =>
                setArtist((prev) => ({ ...prev, ...changes }))
              }
            />
          </div>

          {/* Main Content Section */}
          <div className="flex-1 w-full">
            <MainMenu
              localChanges={artist}
              setLocalChanges={(changes) =>
                setArtist((prev) => ({ ...prev, ...changes }))
              }
              onSave={handleSaveArtist}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
