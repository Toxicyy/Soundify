import { useState, type FC } from "react";
import {
  ApartmentOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  HeartFilled,
  HomeOutlined,
  InsertRowRightOutlined,
} from "@ant-design/icons";

interface MainBarProps {
  text: string;
}

export const MainBar: FC<MainBarProps> = ({ text }) => {
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
    <div
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
    </div>
  );
};
