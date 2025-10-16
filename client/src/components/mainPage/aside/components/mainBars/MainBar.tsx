import { useState, useMemo, type FC, memo, type JSX } from "react";
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

const ICON_MAP: Record<string, JSX.Element> = {
  "Home": <HomeOutlined />,
  "Playlists": <ApartmentOutlined />,
  "Artists": <InsertRowRightOutlined />,
  "Liked Songs": <HeartFilled />,
  "Recently": <ClockCircleOutlined />,
  "New Playlist": <FolderOutlined />,
};

/**
 * Navigation item for desktop sidebar
 * Animated link with icon and text label
 */
const MainBar: FC<MainBarProps> = ({
  text,
  animationDuration,
  path,
  callback,
}) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [hover, setHover] = useState(false);

  const icon = useMemo(() => ICON_MAP[text], [text]);
  const isActive = pathname === path && !callback;

  return (
    <Link to={path}>
      <motion.div
        initial={{ marginRight: "800px" }}
        animate={{ marginRight: "0px" }}
        transition={{ duration: animationDuration, ease: "easeInOut" }}
        className={`flex items-center gap-3 w-[13vw] h-[28px] lg:h-[35px] 2xl:h-[35px] rounded-lg pl-4 lg:pl-5 2xl:pl-5 cursor-pointer duration-300 ${
          hover || isActive ? "bg-gray-100/70" : "glass"
        }`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={callback || undefined}
      >
        <div className="text-base lg:text-lg 2xl:text-lg font-semibold">
          {icon}
        </div>
        <h1 className="text-sm lg:text-base 2xl:text-base font-semibold tracking-wider truncate">
          {text}
        </h1>
      </motion.div>
    </Link>
  );
};

export default memo(MainBar);
export { MainBar };
