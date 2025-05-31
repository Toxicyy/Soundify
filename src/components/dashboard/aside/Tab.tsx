import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import type { AppState } from "../../../store";
import type { FC } from "react";
import { Link, useLocation } from "react-router-dom";

interface Tab {
  tab: {
    icon: string;
    name: string;
    path: string;
    children: string[];
  };
}

const Tab: FC<Tab> = ({ tab }) => {
  const location = useLocation();
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );

  return (
    <Link to={tab.path}>
      <motion.div
        className={"flex items-center h-[40px] w-full hover:bg-[#e7e5e5] cursor-pointer duration-300 overflow-hidden " + (location.pathname === tab.path ? "bg-[#e7e5e5]" : "")}
      >
        <div className="w-[70px] flex justify-center min-w-[70px]">
          {" "}
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
    </Link>
  );
};

export default Tab;
