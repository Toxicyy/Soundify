import SearchInput from "./SearchInput";
import UserIcon from "./UserIcon";
import userAvatar from "../../images/User/Anonym.jpg";
import {
  LeftOutlined,
  RightOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import PlaylistModule from "./PlaylistModule";
import ArtistModule from "./ArtistModule";
import MixesModule from "./MixesModule";
import mixImage from "../../images/mix/jazz.jpg";
import Queue from "./Queue";
import { useSelector } from "react-redux";
import type { AppState } from "../../store";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useGetUserQuery } from "../../state/UserApi.slice";
import { div } from "framer-motion/client";

export default function MainMenu() {
  const queueOpen = useSelector((state: AppState) => state.queueOpen.isOpen);
  const { data: user, isFetching } = useGetUserQuery();

  return (
    <div className="h-screen w-full mainMenu pl-[22vw] pt-6 flex gap-10">
      <div className="min-w-[65%] flex flex-col">
        <div className="flex items-center justify-end">
          <motion.div
            initial={{ opacity: 0, y: -300 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-[70%] flex items-center justify-between"
          >
            <SearchInput />
            <UserIcon userIcon={userAvatar} />
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -300 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex gap-4 mb-[10px]"
        >
          <div className="w-[30px] h-[30px] rounded-md glass flex justify-center items-center cursor-not-allowed">
            <LeftOutlined style={{ color: "white" }} />
          </div>
          <div className="w-[30px] h-[30px] rounded-md bg-white flex justify-center items-center hover:bg-gray-200 cursor-pointer">
            <RightOutlined style={{ color: "black" }} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 2000 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <PlaylistModule />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 1200 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <ArtistModule />
        </motion.div>
      </div>

      <div className="w-[35%] flex flex-col gap-0">
        {!isFetching && user ? (
          <motion.div
            className="flex items-center justify-between mr-10 mb-4"
            initial={{ opacity: 1, height: 0, y: -400 }}
            animate={
              !queueOpen
                ? { opacity: 1, height: "auto", y: 0 }
                : { opacity: 0, height: "auto", y: -400 }
            }
            exit={{ opacity: 0, height: 0, y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <h1 className="text-2xl font-bold text-white tracking-wider  flex items-center gap-3">
              Happy listening,{" "}
              <div className="glass rounded-full px-4 py-2">
                <span className="username ">{user.username}</span>
              </div>
            </h1>
            <SettingOutlined
              style={{ color: "white", fontSize: "36px" }}
              className=" cursor-pointer transition-all duration-300 hover:scale-110"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -400 }}
            animate={
              !queueOpen
                ? { opacity: 1, height: "auto", y: 0 }
                : { opacity: 0, height: "auto", y: -400 }
            }
            exit={{ opacity: 0, height: 0, y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex items-center justify-center gap-10 mb-6"
          >
            <div className="cursor-pointer w-[100px] h-[40px] rounded-full bg-transparent border-2 border-black flex items-center justify-center">
              <Link to={"/signup"}>
                <h1 className="text-black text-xl font-bold">Sign up</h1>
              </Link>
            </div>
            <div className="cursor-pointer w-[120px] h-[50px] rounded-full bg-transparent border-2 border-white flex items-center justify-center">
              <Link to={"/login"}>
                <h1 className="text-white text-xl font-bold">Log in</h1>
              </Link>
            </div>
          </motion.div>
        )}
        <AnimatePresence>
          {!queueOpen && (
            <motion.div
              className={"pr-8 " + user ? "mt-5.5" : ""}
              initial={{ opacity: 0, height: 0, x: 2000 }}
              animate={{ opacity: 1, height: "auto", x: 0 }}
              exit={{ opacity: 0, height: 0, x: 2000 }}
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
          initial={{ opacity: 0, y: 1000 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 1000 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="transition-all"
        >
          <Queue queueOpen={queueOpen} />
        </motion.div>
      </div>
    </div>
  );
}
