import { useLocation, useNavigate } from "react-router-dom";
import { useUserData } from "../hooks/useUserData";
import Header from "../components/Profile/Header";
import Anonym from "../images/User/Anonym.jpg";
import MainMenu from "../components/Profile/MainMenu";
import { useGetUserQuery } from "../state/UserApi.slice";
import { motion } from "framer-motion";
import {
  LockOutlined,
  LoginOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

/**
 * Profile Page Component with responsive design and authentication
 * Features access control, loading states, and error handling
 */

/**
 * Authentication warning component for protected routes
 * Displays animated feature highlights and authentication CTAs
 */
const AuthenticationWarning: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 xl:pl-[22vw]">
      <motion.div
        className="relative max-w-lg w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >

        {/* Main content card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Lock icon with animation */}
          <motion.div
            className="relative mb-6 flex justify-center"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              duration: 1.2,
              type: "spring",
              bounce: 0.6,
              delay: 0.2,
            }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-500/30 rounded-full blur-xl"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1.4, 1.6, 1.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl border border-purple-500/30 flex items-center justify-center">
                <LockOutlined className="text-purple-400 text-4xl" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-white mb-3 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Authentication Required
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            You need to be signed in to access this content. Join our community
            to unlock all features and personalize your experience
          </motion.p>

          {/* Features list */}
          <motion.div
            className="mb-8 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex-shrink-0" />
              <span>Access your personalized profile and library</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex-shrink-0" />
              <span>Create and manage your playlists</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex-shrink-0" />
              <span>Follow artists and discover new music</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex-shrink-0" />
              <span>Connect with the music community</span>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <motion.button
              onClick={() => navigate("/login")}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Sign in to account"
            >
              <LoginOutlined className="text-base" />
              Sign In
            </motion.button>

            <motion.button
              onClick={() => navigate("/signup")}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Create new account"
            >
              <UserAddOutlined className="text-base" />
              Create Account
            </motion.button>
          </motion.div>

          {/* Footer text */}
          <motion.p
            className="text-white/50 text-xs text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            Free forever • No credit card required
          </motion.p>
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Error Display Component
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

  const isAuthenticated = !!currentUser && !isCurrentUserLoading;
  const shouldShowAuthWarning = !isAuthenticated && !isCurrentUserLoading;

  const hasAccess =
    isAuthenticated &&
    (data?._id === currentUser?._id || currentUser?.status === "ADMIN");

  if (shouldShowAuthWarning) {
    return <AuthenticationWarning />;
  }

  if (error && !isLoading) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col mb-35 xl:mb-0">
      <div className="flex-1 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-[22vw] xl:pr-[2vw] pb-5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
          <div className="w-full">
            <Header
              imageSrc={data?.avatar || Anonym}
              username={data?.username || ""}
              isLoading={isLoading}
              playlists={data?.playlists || []}
              likedArtists={
                typeof data?.likedArtists === "string"
                  ? data?.likedArtists || []
                  : []
              }
            />
          </div>

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
