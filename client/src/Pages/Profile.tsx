// Profile.tsx - Main Profile Page Component
import { useLocation } from "react-router-dom";
import { useUserData } from "../hooks/useUserData";
import Header from "../components/Profile/Header";
import Anonym from "../images/User/Anonym.jpg";
import MainMenu from "../components/Profile/MainMenu";
import { useGetUserQuery } from "../state/UserApi.slice";

/**
 * Profile Page Component - Responsive design with authentication
 *
 * RESPONSIVE DESIGN:
 * - Adapts to player sidebar presence/absence
 * - Mobile-first approach with proper breakpoints
 * - Responsive padding: pl-4 (mobile) to pl-[22vw] (desktop with player)
 * - Flexible content layout that works on all screen sizes
 *
 * AUTHENTICATION:
 * - Checks user authentication status
 * - Shows login prompt for unauthenticated users
 * - Handles access control for private content
 * - Proper error states and loading indicators
 *
 * LAYOUT BREAKPOINTS:
 * - Mobile (< 768px): No sidebar, full width with padding
 * - Tablet (768px - 1279px): Partial sidebar visibility
 * - Desktop (>= 1280px): Full sidebar with player (pl-[22vw])
 *
 * ACCESS CONTROL:
 * - Own profile: Full access to private content
 * - Admin users: Full access to all profiles
 * - Other users: Public content only
 */

/**
 * Authentication Warning Component
 * Displays when user is not authenticated
 */
const AuthenticationWarning = () => (
  <div className="min-h-screen w-full flex items-center justify-center p-4 xl:pl-[22vw]">
    <div className="max-w-md w-full bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
      {/* Icon */}
      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      {/* Content */}
      <h1 className="text-2xl font-bold text-white mb-4">
        Authentication Required
      </h1>
      <p className="text-white/70 mb-6 leading-relaxed">
        You need to be logged in to view user profiles. Please sign in to
        continue and access all features.
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => (window.location.href = "/login")}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
        >
          Sign In
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
        New to our platform? Join thousands of music lovers today!
      </p>
    </div>
  </div>
);

/**
 * Error Display Component
 * Shows error states with retry functionality
 */
const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen w-full flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-red-50/10 border border-red-200/20 rounded-2xl p-6 text-center">
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
        onClick={onRetry}
        className="bg-red-100/20 hover:bg-red-100/30 text-red-300 px-4 py-2 rounded-xl transition-colors duration-200"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default function Profile() {
  const location = useLocation();
  const userId = location.pathname.split("/")[2];
  const { data, isLoading, error, refetch } = useUserData(userId);
  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useGetUserQuery();

  // Check authentication status
  const isAuthenticated = !!currentUser && !isCurrentUserLoading;
  const shouldShowAuthWarning = !isAuthenticated && !isCurrentUserLoading;

  // Determine access level for authenticated users
  const hasAccess =
    isAuthenticated &&
    (data?._id === currentUser?._id || currentUser?.status === "ADMIN");

  // Show authentication warning for unauthenticated users
  if (shouldShowAuthWarning) {
    return <AuthenticationWarning />;
  }

  // Show error state
  if (error && !isLoading) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col mb-35 xl:mb-0">
      {/* 
        Responsive container with adaptive padding:
        - Mobile: pl-4 pr-4 (no sidebar)
        - Tablet: pl-6 pr-6 (partial sidebar)
        - Desktop: pl-[22vw] pr-[2vw] (full sidebar with player)
      */}
      <div className="flex-1 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-[22vw] xl:pr-[2vw] pb-5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
          {/* Header Section */}
          <div className="w-full">
            <Header
              imageSrc={data?.avatar || Anonym}
              username={data?.username || ""}
              isLoading={isLoading}
              playlists={data?.playlists || []}
              likedArtists={data?.likedArtists || []}
            />
          </div>

          {/* Main Content Section */}
          <div className="flex-1 min-h-0 w-full">
            <MainMenu
              userId={userId}
              isLoading={isLoading}
              access={hasAccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
