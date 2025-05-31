import { motion } from "framer-motion";
import Tab from "./aside/Tab";
import DashBoardImage from "../../images/dashboard/tabs/dashboard.png";
import FileManagerImage from "../../images/dashboard/tabs/fileManager.png";
import { useSelector } from "react-redux";
import type { AppState } from "../../store";

const tabs = [
  {
    icon: DashBoardImage,
    name: "Dashboard",
    path: "/dashboard/statistic",
    children: [],
  },
  {
    icon: FileManagerImage,
    name: "File Manager",
    path: "/dashboard/file-manager",
    children: [],
  },
];

export default function Aside() {
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );

  return (
    <motion.div
      initial={false}
      animate={{
        width: isMenuOpen ? 230 : 70,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed h-screen flex-col border-r-1 border-[#e6e6e6] flex gap-3 overflow-hidden"
    >
      <div className="flex items-center gap-2 justify-center p-4">
        <img
          src="../src/images/logo/Soundify.png"
          alt="Soundify"
          className="w-[50px] min-w-[50px]"
        />
      </div>
      
      <div className="flex flex-col">
        {tabs.map((tab, index) => (
          <Tab key={index} tab={tab} />
        ))}
      </div>
    </motion.div>
  );
}