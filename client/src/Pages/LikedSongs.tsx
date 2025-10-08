import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  LoginOutlined,
  UserOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  HeartOutlined,
  HeartFilled,
  ArrowLeftOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Header from "../components/likedSongs/Header";
import MainMenu from "../components/likedSongs/MainMenu";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useLikedTracksLoader } from "../hooks/useLikedTracksLoader";

/**
 * Authentication required state component
 * Displays animated interface encouraging users to sign in
 */
const AuthRequiredState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 xs:py-12 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated music icons background */}
      <div className="absolute inset-0 overflow-hidden opacity-5" aria-hidden="true">
        <motion.div
          className="absolute top-10 left-10"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SoundOutlined className="text-6xl text-white" />
        </motion.div>
        <motion.div
          className="absolute top-20 right-20"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <PlayCircleOutlined className="text-8xl text-white" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-20"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 20, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <StarFilled className="text-5xl text-white" />
        </motion.div>
        <motion.div
          className="absolute bottom-16 right-16"
          animate={{
            y: [0, 25, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <HeartOutlined className="text-7xl text-white" />
        </motion.div>
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center max-w-md"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.8,
          type: "spring",
          bounce: 0.4,
          delay: 0.2,
        }}
      >
        {/* Heart icon with glow effect */}
        <motion.div
          className="relative mb-6 xs:mb-4"
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{
            duration: 1.2,
            type: "spring",
            bounce: 0.6,
            delay: 0.3,
          }}
        >
          <div className="relative inline-block">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-pink-500/30 rounded-full blur-xl scale-150"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1.4, 1.6, 1.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              aria-hidden="true"
            />
            <div className="relative p-6 xs:p-4 bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl border border-red-500/30">
              <HeartFilled className="text-red-400 text-6xl xs:text-5xl" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-2xl xs:text-xl font-bold text-white mb-3 xs:mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Your Liked Songs Library
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-white/70 text-base xs:text-sm leading-relaxed mb-8 xs:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Sign in to access your personal collection of liked songs and create
          your ultimate music library
        </motion.p>

        {/* Features list */}
        <motion.div
          className="mb-8 xs:mb-6 space-y-3 xs:space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          {[
            {
              gradient: "from-red-500 to-pink-500",
              text: "Like unlimited songs and build your library",
            },
            {
              gradient: "from-purple-500 to-pink-500",
              text: "Access your favorites anytime, anywhere",
            },
            {
              gradient: "from-blue-500 to-cyan-500",
              text: "Get personalized music recommendations",
            },
            {
              gradient: "from-green-500 to-emerald-500",
              text: "Create playlists from your liked songs",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-white/80 text-sm xs:text-xs"
            >
              <div
                className={`w-2 h-2 bg-gradient-to-r ${feature.gradient} rounded-full flex-shrink-0`}
                aria-hidden="true"
              />
              <span>{feature.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col xs:flex-row gap-3 xs:gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <motion.button
            onClick={() => navigate("/login")}
            className="flex items-center justify-center gap-2 px-6 xs:px-4 py-3 xs:py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-xl xs:rounded-lg transition-all duration-300 shadow-lg hover:shadow-red-500/25 text-sm xs:text-xs"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Sign in to your account"
          >
            <LoginOutlined className="text-base xs:text-sm" />
            Sign In
          </motion.button>

          <motion.button
            onClick={() => navigate("/signup")}
            className="flex items-center justify-center gap-2 px-6 xs:px-4 py-3 xs:py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl xs:rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30 text-sm xs:text-xs"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Create a new account"
          >
            <UserOutlined className="text-base xs:text-sm" />
            Create Account
          </motion.button>
        </motion.div>

        {/* Additional info */}
        <motion.p
          className="text-white/50 text-xs xs:text-[10px] mt-6 xs:mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          Free forever • No credit card required
        </motion.p>
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-400/30 rounded-full"
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

      {/* Floating hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`heart-${i}`}
            className="absolute text-red-400/20"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              fontSize: `${12 + Math.random() * 8}px`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 15, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 6 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          >
            <HeartFilled />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Loading component for authentication state
 */
const LoadingComponent: React.FC = () => (
  <motion.div
    className="h-screen w-full mainMenu pl-4 xl:pl-[22vw] pr-2 xl:pr-[2vw] flex items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 xs:w-12 xs:h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-white/70 text-sm xs:text-base">Loading...</p>
    </div>
  </motion.div>
);

/**
 * Liked Songs page with responsive design and authentication handling
 */
export default function LikedSongs() {
  const navigate = useNavigate();
  const { data: user, isFetching: userLoading } = useGetUserQuery();
  const { isLoading, likedTracks, loadLikedTracks } = useLikedTracksLoader();
  const loadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?._id && !userLoading && loadedUserIdRef.current !== user._id) {
      loadedUserIdRef.current = user._id;
      loadLikedTracks(user._id);
    }

    if (!user) {
      loadedUserIdRef.current = null;
    }
  }, [user?._id, userLoading, loadLikedTracks]);

  // Show loading state while checking user authentication
  if (userLoading) {
    return <LoadingComponent />;
  }

  // Show authentication required state if user is not logged in
  if (!user) {
    return (
      <motion.div
        className="h-screen w-full mainMenu pl-4 xl:pl-[22vw] pr-2 xl:pr-[2vw] flex flex-col gap-4 xs:gap-6 py-4 xs:py-6 mb-35 xl:mb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Page Header */}
        <motion.header
          className="flex items-center gap-3 xs:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Back Button */}
          <motion.button
            onClick={() => navigate(-1)}
            className="p-2 xs:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-lg xs:rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go back to previous page"
          >
            <ArrowLeftOutlined className="text-white text-base xs:text-xl" />
          </motion.button>

          {/* Page Title Section */}
          <div className="flex items-center gap-2 xs:gap-3">
            <motion.div
              className="p-2 xs:p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-lg xs:rounded-xl border border-red-500/30"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                type: "spring",
                bounce: 0.6,
              }}
            >
              <HeartFilled className="text-red-400 text-lg xs:text-2xl" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-white text-2xl xs:text-3xl font-bold">
                Liked Songs
              </h1>
              <p className="text-white/70 text-sm xs:text-lg">
                Your personal favorites
              </p>
            </motion.div>
          </div>
        </motion.header>

        {/* Authentication Required Content */}
        <motion.section
          className="bg-white/5 md:bg-white/5 md:backdrop-blur-lg border border-white/10 rounded-xl xs:rounded-2xl overflow-hidden flex-1 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          role="main"
          aria-label="Authentication required section"
        >
          <AuthRequiredState />
        </motion.section>
      </motion.div>
    );
  }

  // Main content for authenticated users
  return (
    <div className="h-screen w-full mainMenu pl-4 xl:pl-[22vw] pr-2 xl:pr-[2vw] md:mb-30 flex flex-col gap-3 md:gap-4 xl:gap-5 pt-3 md:pt-6 mb-35 xl:mb-0">
      {/* Header component with responsive sizing */}
      <Header tracks={likedTracks} />

      {/* MainMenu component takes remaining space */}
      <div className="flex-1 min-h-0 mb-2 md:mb-4 xl:mb-5">
        <MainMenu tracks={likedTracks} isLoading={isLoading} />
      </div>
    </div>
  );
}
