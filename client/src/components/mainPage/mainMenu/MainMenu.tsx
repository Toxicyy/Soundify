import { useEffect, useState, memo, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { skipToken } from "@reduxjs/toolkit/query/react";
import type { AppState } from "../../../store";
import { useGetUserQuery } from "../../../state/UserApi.slice";
import { useDailyContentLoader } from "../../../hooks/useDailyContentLoader";
import type { Playlist } from "../../../types/Playlist";
import SearchInput from "./components/SearchInput";
import UserIcon from "./components/UserIcon";
import SettingsMenu from "./components/SettingsMenu";
import PlaylistModule from "./components/PlaylistModule";
import ArtistModule from "./components/ArtistModule";
import ChartModule from "./components/ChartModule";
import Queue from "./components/Queue";
import AnimatedBurgerMenu from "./components/AnimatedBurgerMenu";
import userAvatar from "../../../images/User/Anonym.jpg";
import chartImage from "../../../images/chart/global.jpg";

/**
 * Main page layout component with responsive sidebar and content
 * Features user authentication, daily content, and queue management
 */
const MainMenu = () => {
  const queueOpen = useSelector((state: AppState) => state.queue.isOpen);
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("token"), []);

  const { data: user, isFetching } = useGetUserQuery(
    token ? undefined : skipToken
  );

  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  const { dailyTracks, featuredPlaylist, isLoading, loadDailyContent } =
    useDailyContentLoader();

  useEffect(() => {
    loadDailyContent();
  }, [loadDailyContent]);

  const toggleSettingsMenu = () => {
    setIsSettingsMenuOpen((prev) => !prev);
  };

  const closeSettingsMenu = () => {
    setIsSettingsMenuOpen(false);
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full mainMenu pl-4 xl:pl-[22vw] mb-35 xl:mb-0 pt-3 md:pt-6 flex flex-col xl:flex-row gap-4 md:gap-6 xl:gap-10 overflow-hidden">
      <div className="w-full xl:w-[65%] flex flex-col px-2 md:px-4 xl:px-0 overflow-y-auto xl:overflow-y-visible">
        {/* Mobile/Tablet Header */}
        <div className="flex xl:hidden items-center justify-between mb-4 md:mb-6 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -300 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full flex items-center justify-between gap-3"
          >
            <div className="flex-1 mr-5 max-w-md">
              <SearchInput />
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <UserIcon userIcon={user?.avatar ? user.avatar : userAvatar} />
              )}

              {user && (
                <div className="relative">
                  <AnimatedBurgerMenu
                    isOpen={isSettingsMenuOpen}
                    onClick={toggleSettingsMenu}
                    size={30}
                    color="white"
                    className="transition-transform duration-300"
                  />
                  <SettingsMenu
                    isOpen={isSettingsMenuOpen}
                    onClose={closeSettingsMenu}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Desktop Header */}
        <div className="hidden xl:flex items-center justify-end mb-6">
          <motion.div
            initial={{ opacity: 0, y: -300 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-[70%] flex items-center justify-between gap-6"
          >
            <SearchInput />
            {user && (
              <UserIcon userIcon={user?.avatar ? user.avatar : userAvatar} />
            )}
          </motion.div>
        </div>

        {/* Auth buttons for non-logged users - Mobile/Tablet */}
        {!user && !isFetching && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -400 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex xl:hidden items-center justify-center gap-4 md:gap-6 mb-4 md:mb-6 flex-shrink-0"
          >
            <button
              className="px-6 py-2.5 rounded-lg bg-purple-900/30 backdrop-blur-md border border-purple-500/30 text-purple-100 font-medium hover:bg-purple-800/40 transition-all duration-300 shadow-lg hover:shadow-purple-900/30 hover:scale-[1.02] active:scale-95"
              onClick={handleSignUp}
              aria-label="Sign up for account"
            >
              Sign Up
            </button>

            <button
              className="px-6 py-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-purple-900/20 hover:scale-[1.02] active:scale-95"
              onClick={handleSignIn}
              aria-label="Sign in to account"
            >
              Sign In
            </button>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6 xl:gap-8 min-h-0 pb-4">
          <motion.div
            initial={{ opacity: 0, x: 2000 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-shrink-0"
          >
            <PlaylistModule
              playlist={featuredPlaylist || ({} as Playlist)}
              isLoading={isLoading}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 1200 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-shrink-0"
          >
            <ArtistModule dailyTracks={dailyTracks} isLoading={isLoading} />
          </motion.div>

          <AnimatePresence>
            <motion.div
              className="block xl:hidden flex-shrink-0"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <ChartModule chartImage={chartImage} />
            </motion.div>
          </AnimatePresence>
        </div>

        {isLoading && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 text-sm rounded-lg backdrop-blur-md border border-white/20 z-50">
            Loading...
          </div>
        )}
      </div>

      {/* Right Sidebar - Desktop Only */}
      <div className="hidden xl:flex xl:w-[35%] flex-col gap-0 overflow-hidden xl:mt-2">
        {!isFetching && user && (
          <motion.div
            className="flex items-center justify-between mb-4 relative"
            initial={{ opacity: 1, height: 0, y: -400 }}
            animate={
              !queueOpen
                ? { opacity: 1, height: "auto", y: 0 }
                : { opacity: 0, height: "auto", y: -400 }
            }
            exit={{ opacity: 0, height: 0, y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <h1 className="text-xl 2xl:text-2xl font-bold text-white tracking-wider flex items-center gap-3">
              Happy listening,{" "}
              <div className="bg-white/20 rounded-full px-3 py-1">
                <span className="username text-sm 2xl:text-base">
                  {user.username.length > 10
                    ? user.username.substring(0, 10) + "..."
                    : user.username}
                </span>
              </div>
            </h1>

            <div className="relative px-7">
              <AnimatedBurgerMenu
                isOpen={isSettingsMenuOpen}
                onClick={toggleSettingsMenu}
                size={40}
                color="white"
                className="transition-transform duration-300"
              />
              <SettingsMenu
                isOpen={isSettingsMenuOpen}
                onClose={closeSettingsMenu}
              />
            </div>
          </motion.div>
        )}

        {!user && !isFetching && (
          <motion.div
            className="flex items-center mb-4 relative flex-shrink-0 gap-4 mx-auto"
            initial={{ opacity: 1, height: 0, y: -400 }}
            animate={
              !queueOpen
                ? { opacity: 1, height: "auto", y: 0 }
                : { opacity: 0, height: "auto", y: -400 }
            }
            exit={{ opacity: 0, height: 0, y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <button
              className="px-6 py-2.5 rounded-lg bg-purple-900/30 backdrop-blur-md border border-purple-500/30 text-purple-100 font-medium hover:bg-purple-800/40 transition-all duration-300 shadow-lg hover:shadow-purple-900/30 hover:scale-[1.02] active:scale-95"
              onClick={handleSignUp}
              aria-label="Sign up for account"
            >
              Sign Up
            </button>

            <button
              className="px-6 py-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-purple-900/20 hover:scale-[1.02] active:scale-95"
              onClick={handleSignIn}
              aria-label="Sign in to account"
            >
              Sign In
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {!queueOpen && (
            <motion.div
              className="pr-6 flex-shrink-0"
              initial={{ opacity: 0, height: 0, x: 2000 }}
              animate={{ opacity: 1, height: "auto", x: 0 }}
              exit={{ opacity: 0, height: 0, x: 2000 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ overflow: "visible" }}
            >
              <ChartModule chartImage={chartImage} />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`transition-all duration-500 ${
            queueOpen ? "flex-1 h-full" : "h-auto max-h-96"
          }`}
        >
          <motion.div
            key="queue"
            layout
            initial={{ opacity: 0, y: 1600 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 1600 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full"
          >
            <Queue queueOpen={queueOpen} />
          </motion.div>
        </div>
      </div>

      {/* Mobile/Tablet Queue Overlay */}
      <div className="xl:hidden">
        <Queue queueOpen={queueOpen} />
      </div>
    </div>
  );
};

export default memo(MainMenu);
