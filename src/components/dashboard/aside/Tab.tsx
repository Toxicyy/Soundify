import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import type { AppState } from "../../../store";
import type { FC } from "react";

interface Tab {
  tab: {
    icon: string;
    name: string;
    path: string;
    children: string[];
  };
}

const Tab: FC<Tab> = ({ tab }) => {
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );

  return (
    <motion.div
      className="flex items-center h-[40px] w-full hover:bg-[#f5f3f3] cursor-pointer duration-200 overflow-hidden"
      whileHover={{ backgroundColor: "rgba(245, 243, 243, 0.8)" }}
    >
      <div className="w-[70px] flex justify-center min-w-[70px]">
        {" "}
        {/* Фиксированный контейнер для иконки */}
        <img
          src={tab.icon}
          alt="Tab Icon"
          className="w-[25px] h-[25px] mb-0.5"
        />
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: -10 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="text-md tracking-wider text-black/60 whitespace-nowrap"
          >
            {tab.name}
          </motion.h1>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Tab;
