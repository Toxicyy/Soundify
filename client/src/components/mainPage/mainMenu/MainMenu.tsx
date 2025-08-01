import SearchInput from "./components/SearchInput";
import UserIcon from "./components/UserIcon";
import SettingsMenu from "./components/SettingsMenu";
import userAvatar from "../../../images/User/Anonym.jpg";
import { SettingOutlined } from "@ant-design/icons";
import PlaylistModule from "./components/PlaylistModule";
import ArtistModule from "./components/ArtistModule";
import chartImage from "../../../images/chart/global.jpg";
import Queue from "./components/Queue";
import { useSelector } from "react-redux";
import type { AppState } from "../../../store";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useGetUserQuery } from "../../../state/UserApi.slice";
import { useEffect, useState } from "react";
import { useDailyContentLoader } from "../../../hooks/useDailyContentLoader";
import type { Playlist } from "../../../types/Playlist";
import ChartModule from "./components/ChartModule";
import { skipToken } from "@reduxjs/toolkit/query/react";

export default function MainMenu() {
  const queueOpen = useSelector((state: AppState) => state.queue.isOpen);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { data: user, isFetching } = useGetUserQuery(token ? undefined : skipToken);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // Используем новый хук
  const { dailyTracks, featuredPlaylist, isLoading, loadDailyContent } =
    useDailyContentLoader();

  useEffect(() => {
    loadDailyContent();
  }, []);

  // Функция для переключения меню настроек
  const toggleSettingsMenu = () => {
    setIsSettingsMenuOpen(!isSettingsMenuOpen);
  };

  // Функция для закрытия меню настроек
  const closeSettingsMenu = () => {
    setIsSettingsMenuOpen(false);
  };

  return (
    <div className="min-h-screen w-full mainMenu pl-4 xl:pl-[22vw] mb-35 xl:mb-0 pt-3 md:pt-6 flex flex-col xl:flex-row gap-4 md:gap-6 xl:gap-10 overflow-hidden">
      {/* Main Content - Full width on mobile/tablet, 62% on desktop */}
      <div className="w-full xl:w-[65%] flex flex-col px-2 md:px-4 xl:px-0 overflow-y-auto xl:overflow-y-visible">
        {/* Header with Search and User - Mobile/Tablet only */}
        <div className="flex xl:hidden items-center justify-between mb-4 md:mb-6 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -300 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full flex items-center justify-between gap-3"
          >
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <SearchInput />
            </div>

            {/* User and Settings Section */}
            <div className="flex items-center gap-3">
              {user && (
                <UserIcon userIcon={user?.avatar ? user.avatar : userAvatar} />
              )}

              {/* Settings button for mobile/tablet */}
              {user && (
                <div className="relative">
                  <SettingOutlined
                    style={{ color: "white", fontSize: "24px" }}
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 ${
                      isSettingsMenuOpen ? "scale-110 text-blue-400" : ""
                    }`}
                    onClick={toggleSettingsMenu}
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

        {/* Desktop Header with Search and User */}
        <div className="hidden xl:flex items-center justify-end mb-6">
          <motion.div
            initial={{ opacity: 0, y: -300 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-[70%] flex items-center justify-between"
          >
            <SearchInput />
            {user && (
              <UserIcon userIcon={user?.avatar ? user.avatar : userAvatar} />
            )}
          </motion.div>
        </div>

        {/* Auth buttons for non-logged users - Mobile/Tablet only */}
        {!user && !isFetching && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -400 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex xl:hidden items-center justify-center gap-4 md:gap-6 mb-4 md:mb-6 flex-shrink-0"
          >
            <div className="cursor-pointer w-20 md:w-24 xl:w-[100px] h-8 md:h-10 xl:h-[40px] rounded-full bg-transparent border-2 border-black flex items-center justify-center hover:scale-110 transition-all duration-300">
              <Link to={"/signup"}>
                <h1 className="text-black text-sm md:text-lg xl:text-xl font-bold">
                  Sign up
                </h1>
              </Link>
            </div>
            <div className="cursor-pointer w-20 md:w-28 xl:w-[120px] h-10 md:h-12 xl:h-[50px] rounded-full bg-transparent border-2 border-white flex items-center justify-center hover:scale-110 transition-all duration-300">
              <Link to={"/login"}>
                <h1 className="text-white text-sm md:text-lg xl:text-xl font-bold">
                  Log in
                </h1>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6 xl:gap-8 min-h-0 pb-4">
          {/* Playlist Module */}
          <motion.div
            initial={{ opacity: 0, x: 2000 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-shrink-0"
          >
            <PlaylistModule
              playlist={featuredPlaylist ? featuredPlaylist : ({} as Playlist)}
            />
          </motion.div>

          {/* Artists Module */}
          <motion.div
            initial={{ opacity: 0, y: 1200 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-shrink-0"
          >
            <ArtistModule dailyTracks={dailyTracks} isLoading={isLoading} />
          </motion.div>

          {/* Chart Module - Show on mobile/tablet below artists */}
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

        {/* Loading indicator */}
        {isLoading && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 text-sm rounded-lg backdrop-blur-md border border-white/20 z-50">
            Loading...
          </div>
        )}
      </div>

      {/* Right Sidebar - Desktop Only */}
      <div className="hidden xl:flex xl:w-[35%] flex-col gap-0 overflow-hidden xl:mt-2">
        {/* User Greeting - Desktop only */}
        {!isFetching && user && (
          <motion.div
            className="flex items-center justify-between mb-4 relative flex-shrink-0"
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
              <SettingOutlined
                style={{ color: "white", fontSize: "28px" }}
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${
                  isSettingsMenuOpen ? "scale-110 text-blue-400" : ""
                }`}
                onClick={toggleSettingsMenu}
              />
              <SettingsMenu
                isOpen={isSettingsMenuOpen}
                onClose={closeSettingsMenu}
              />
            </div>
          </motion.div>
        )}

        {!user && (
          <motion.div
            className="flex items-center mb-4 relative flex-shrink-0 gap-4 px-4"
            initial={{ opacity: 1, height: 0, y: -400 }}
            animate={
              !queueOpen
                ? { opacity: 1, height: "auto", y: 0 }
                : { opacity: 0, height: "auto", y: -400 }
            }
            exit={{ opacity: 0, height: 0, y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <button className="px-6 py-2.5 rounded-lg bg-purple-900/30 backdrop-blur-md border border-purple-500/30 text-purple-100 font-medium hover:bg-purple-800/40 transition-all duration-300 shadow-lg hover:shadow-purple-900/30 hover:scale-[1.02] active:scale-95" onClick={() => navigate("/signup")}>
              Sign Up
            </button>

            <button className="px-6 py-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-purple-900/20 hover:scale-[1.02] active:scale-95" onClick={() => navigate("/login")}>
              Sign In
            </button>
          </motion.div>
        )}

        {/* Chart Module - Desktop */}
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

        {/* Queue - Desktop */}
        <motion.div
          key="queue"
          layout
          initial={{ opacity: 0, y: 1000 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 1000 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="transition-all flex-1 min-h-0"
        >
          <Queue queueOpen={queueOpen} />
        </motion.div>
      </div>

      {/* Mobile/Tablet Queue Overlay - Only render for non-desktop */}
      <div className="xl:hidden">
        <Queue queueOpen={queueOpen} />
      </div>
    </div>
  );
}
