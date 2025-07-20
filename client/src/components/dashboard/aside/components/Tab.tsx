import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import type { AppState } from "../../../../store";
import { useState, type FC } from "react";
import { Link, useLocation } from "react-router-dom";
import { RightOutlined } from "@ant-design/icons";

interface Tab {
  tab: {
    icon: string;
    name: string;
    path: string;
    children: {
      name: string;
      path: string;
    }[];
  };
}

const Tab: FC<Tab> = ({ tab }) => {
  const location = useLocation();
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );
  const [tabOpen, setTabOpen] = useState(false);

  const handleTabClick = (e: React.MouseEvent) => {
    if (tab.children.length > 0) {
      e.preventDefault();
      setTabOpen(!tabOpen);
    }
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTabOpen(!tabOpen);
  };

  return (
    <>
      <Link to={tab.path} onClick={handleTabClick}>
        <motion.div
          className={
            "flex items-center h-[40px] w-full hover:bg-[#f3f2f2] cursor-pointer duration-300 overflow-hidden " +
            (location.pathname === tab.path ? "bg-[#f3f2f2]" : "")
          }
        >
          <div className="w-[70px] flex justify-center min-w-[70px]">
            <img
              src={tab.icon}
              alt="Tab Icon"
              className="w-[25px] h-[25px] mb-0.5"
            />
          </div>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: -10 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-md tracking-wider text-black/80 whitespace-nowrap flex-1"
                >
                  {tab.name}
                </motion.h1>

                {tab.children.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mr-4 flex items-center justify-center"
                    onClick={handleArrowClick}
                  >
                    <motion.div
                      animate={{ rotate: tabOpen ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-black/80"
                    >
                      <RightOutlined />
                    </motion.div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>

      {/* Дочерние элементы */}
      <AnimatePresence>
        {isMenuOpen && tabOpen && tab.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {tab.children.map((child, index) => (
              <Link key={index} to={child.path}>
                <motion.div
                  initial={{ opacity: 0,  }}
                  animate={{ opacity: 1, }}
                  exit={{ opacity: 0, }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={
                    "flex items-center h-[40px] pl-[33px] hover:bg-[#e7e5e5] cursor-pointer duration-300 gap-2 " +
                    (location.pathname === child.path ? "bg-[#e7e5e5]" : "bg-[#f3f2f2]")
                  }
                >
                  <div className="w-[7px] h-[7px] rounded-full border-[1px] border-black mt-[-2px]"></div>
                  <span className="text-sm tracking-wider text-black/60 whitespace-nowrap">
                    {child.name}
                  </span>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Tab;
