import { useState, type FC } from "react";
import {
  ApartmentOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  HeartFilled,
  HomeOutlined,
  InsertRowRightOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

interface MainBarProps {
  text: string;
  animationDuration: number;
  path: string;
  callback?: () => void;
}

export const MainBar: FC<MainBarProps> = ({
  text,
  animationDuration,
  path,
  callback,
}) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [hover, setHover] = useState(false);
  const icons = {
    Home: <HomeOutlined />,
    Playlists: <ApartmentOutlined />,
    Artists: <InsertRowRightOutlined />,
    "Liked Songs": <HeartFilled />,
    Recently: <ClockCircleOutlined />,
    "New Playlist": <FolderOutlined />,
  };

  return (
    <Link to={path}>
      <motion.div
        initial={{ marginRight: "800px" }}
        animate={{ marginRight: "0px" }}
        transition={{ duration: animationDuration, ease: "easeInOut" }}
        className={
          "flex items-center gap-3 w-[13vw] h-[28px] lg:h-[35px] 2xl:h-[35px] rounded-lg pl-4 lg:pl-5 2xl:pl-5 cursor-pointer duration-300 " +
          (hover || (pathname === path && !callback)
            ? "bg-gray-100/70"
            : "glass")
        }
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={callback ? callback : () => {}}
      >
        <div className="text-base lg:text-lg 2xl:text-lg font-semibold">
          {icons[text as keyof typeof icons]}
        </div>
        <h1 className="text-sm lg:text-base 2xl:text-base font-semibold tracking-wider truncate">
          {text}
        </h1>
      </motion.div>
    </Link>
  );
};
