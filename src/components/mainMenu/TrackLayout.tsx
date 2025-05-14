import {
  EllipsisOutlined,
  HeartFilled,
  HeartOutlined,
} from "@ant-design/icons";
import { useState } from "react";

export default function TrackLayout({
  trackImage,
  songName,
  listenCount,
  duration,
}: {
  trackImage: string;
  songName: string;
  listenCount: string;
  duration: string;
}) {
  const [liked, setLiked] = useState(false);
  const [likeHover, setLikeHover] = useState(false);
  return (
    <div className="flex justify-between items-center w-[40vw]">
      <div className="flex gap-3 items-end justify-center">
        <img
          src={trackImage}
          alt=""
          className="w-[65px] h-[65px] rounded-[10px]"
        />
        <div>
          <h1 className="text-white text-lg  tracking-wider">{songName}</h1>
          <h1 className="text-sm tracking-wider" style={{color: "rgba(255, 255, 255, 0.6)"}}>{listenCount}</h1>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <h1 style={{color: "rgba(255, 255, 255, 0.6)"}} className="mr-20">{duration}</h1>
        {liked ? (
          <HeartFilled
            style={{
              color: likeHover ? "#F93822" : "red",
              fontSize: "1.1rem",
            }}
            className="pb-1"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={() => setLiked(false)}
          />
        ) : (
          <HeartOutlined
            style={{
              color: likeHover ? "#D3D3D3" : "white",
              fontSize: "1.1rem",
            }}
            className="pb-1"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={() => setLiked(true)}
          />
        )}
        <EllipsisOutlined style={{color: "white"}} className="cursor-pointer"/>
      </div>
    </div>
  );
}
