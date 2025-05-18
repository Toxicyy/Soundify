import SearchInput from "./SearchInput";
import UserIcon from "./UserIcon";
import userAvatar from "../../images/User/Anonym.jpg";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import PlaylistModule from "./PlaylistModule";
import ArtistModule from "./ArtistModule";
import MixesModule from "./MixesModule";
import mixImage from "../../images/mix/jazz.jpg";
import Queue from "./Queue";
import { useSelector } from "react-redux";
import type { AppState } from "../../store";
import { motion, AnimatePresence } from "framer-motion";

export default function MainMenu() {
  const queueOpen = useSelector((state: AppState) => state.queueOpen.isOpen);

  // Задай высоты под свои нужды!
  const closedQueueHeight = 0.47 * window.innerHeight; // 37.8vh
  const openQueueHeight = window.innerHeight - 120; // Например, 100vh минус header/отступы

  return (
    <div className="h-screen w-[80vw] mainMenu pl-8 pt-6 flex gap-10">
      <div className="min-w-[65%] flex flex-col">
        <div className="flex items-center justify-end">
          <div className="w-[70%] flex items-center justify-between">
            <SearchInput />
            <UserIcon userIcon={userAvatar} />
          </div>
        </div>
        <div className="flex gap-4 mb-[10px]">
          <div className="w-[30px] h-[30px] rounded-md glass flex justify-center items-center cursor-not-allowed">
            <LeftOutlined style={{ color: "white" }} />
          </div>
          <div className="w-[30px] h-[30px] rounded-md bg-white flex justify-center items-center hover:bg-gray-200 cursor-pointer">
            <RightOutlined style={{ color: "black" }} />
          </div>
        </div>
        <PlaylistModule />
        <ArtistModule />
      </div>

      {/* Правая колонка */}
      <div className="w-[35%] pt-21 flex flex-col gap-3">
        <AnimatePresence>
          {!queueOpen && (
            <motion.div
              className="pr-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ overflow: "visible" }}
            >
              <MixesModule mixImage={mixImage} />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          key="queue"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0, ease: "easeInOut" }}
          className="transition-all"
        >
          <Queue queueOpen={queueOpen} />
        </motion.div>
      </div>
    </div>
  );
}
