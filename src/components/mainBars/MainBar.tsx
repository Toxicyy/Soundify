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

interface MainBarProps {
  text: string;
  animationDuration: number;
}

export const MainBar: FC<MainBarProps> = ({ text, animationDuration }) => {
  const [hover, setHover] = useState(false);
  const icons = {
    Home: <HomeOutlined />,
    Radio: <ApartmentOutlined />,
    Library: <InsertRowRightOutlined />,
    "Liked Songs": <HeartFilled />,
    Recently: <ClockCircleOutlined />,
    "New Playlist": <FolderOutlined />,
  };

  return (
    <motion.div
      initial={{ marginRight: "800px" }}
      animate={{ marginRight: "0px" }}
      transition={{ duration: animationDuration, ease: "easeInOut" }}
      className={
        "flex items-center gap-3 w-[13vw] h-[35px] rounded-lg pl-5 cursor-pointer duration-300 " +
        (hover ? "bg-gray-100/70" : "glass")
      }
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="text-lg font-semibold">
        {icons[text as keyof typeof icons]}
      </div>
      <h1 className="font-semibold tracking-wider">{text}</h1>
    </motion.div>
  );
};
