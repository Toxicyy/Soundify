import {
  CaretRightOutlined,
  HeartFilled,
  HeartOutlined,
  LinkOutlined,
  MenuUnfoldOutlined,
  MutedOutlined,
  PauseOutlined,
  RetweetOutlined,
  ShareAltOutlined,
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import testPlayerImage from "../../../images/player/testPlayerImage.jpg";
import { useState } from "react";
import { setQueueOpen } from "../../../state/QueseOpen.slice";
import type { AppDispatch } from "../../../store";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";

export const Player = ({ max }: { max: number }) => {
  const [liked, setLiked] = useState(false);
  const [likeHover, setLikeHover] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isQueue, setIsQueue] = useState(false);
  const [isShare, setIsShare] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [value, setValue] = useState(0);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const currentStr = formatTime(value);
  const totalStr = formatTime(max);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
    // Здесь обычно вызывается seek в аудиоплеере, если он у тебя есть
  };
  const track = "What We Takin` Bout";
  const artist = "NCT127";
  
  return (
    <div className="flex flex-col">
      <motion.div
        initial={{ opacity: 0, marginRight: "1000px" }}
        animate={{ opacity: 1, marginRight: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-[13vw] h-[13vw] mb-7 self-center"
      >
        <img
          src={testPlayerImage}
          alt="Music Image"
          className="rounded-2xl drop-shadow-[0_7px_7px_rgba(0,0,0,0.4)]"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-white/90 font-semibold tracking-wider self-start mb-1">
            {track}
          </h1>
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
        </div>
        <h2 className="text-white/60 mb-2">{artist}</h2>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xs mx-auto rounded-xl flex flex-col items-stretch"
      >
        <div className="flex flex-col w-full mb-2 relative">
          <div className="absolute left-0 top-[2px] -translate-y-1/2 w-full h-[3px] rounded-lg bg-white/40 pointer-events-none" />
          <div
            className="absolute left-0 top-[2px] -translate-y-1/2 h-[3px] rounded-lg bg-white pointer-events-none "
            style={{ width: `${(value / max) * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={max}
            value={value}
            onChange={handleChange}
            className="
            w-full h-[3px]
            rounded-lg
            mt-[1px]
            appearance-none
            bg-transparent
            z-10 relative
            accent-white
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-2
            [&::-webkit-slider-thumb]:h-2
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white/90
            [&::-webkit-slider-thumb]:shadow
            [&::-webkit-slider-thumb]:transition
            [&::-webkit-slider-thumb]:duration-200
            [&::-moz-range-thumb]:w-2
            [&::-moz-range-thumb]:h-2
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white/90
            [&::-moz-range-thumb]:shadow
            [&::-moz-range-thumb]:transition
            [&::-moz-range-thumb]:duration-200
            [&::-ms-thumb]:w-2
            [&::-ms-thumb]:h-2
            [&::-ms-thumb]:rounded-full
            [&::-ms-thumb]:bg-white
            [&::-ms-thumb]:border-2
            [&::-ms-thumb]:border-white/90
            [&::-ms-thumb]:shadow
            [&::-ms-thumb]:transition
            [&::-ms-thumb]:duration-200
            focus:outline-none
          "
          />
          <div className="flex justify-between mt-2 relative z-10">
            <span className="text-[15px] text-white/50 select-none">
              {currentStr}
            </span>
            <span className="text-[15px] text-white/50 select-none">
              {totalStr}
            </span>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="flex items-center justify-between mb-2"
      >
        <RetweetOutlined
          style={{
            color: isRepeating ? "white" : "rgba(255, 255, 255, 0.3)",
            fontSize: "24px",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={() => setIsRepeating(!isRepeating)}
        />
        <StepBackwardOutlined
          style={{ color: "white", fontSize: "24px" }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
        />
        <div
          className="glass rounded-full w-[50px] h-[50px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <PauseOutlined style={{ fontSize: "24px" }} />
          ) : (
            <CaretRightOutlined
              style={{ fontSize: "26px" }}
              className="ml-[4px]"
            />
          )}
        </div>
        <StepForwardOutlined
          style={{ color: "white", fontSize: "24px" }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
        />
        <SwapOutlined
          style={{
            color: isShuffling ? "white" : "rgba(255, 255, 255, 0.3)",
            fontSize: "24px",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={() => setIsShuffling(!isShuffling)}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex items-center justify-between"
      >
        <LinkOutlined
          style={{
            fontSize: "24px",
            color: isLinked ? "white" : "rgba(255, 255, 255, 0.3)",
          }}
          onClick={() => setIsLinked(!isLinked)}
        />
        {isMuted ? (
          <div className="mt-[4px]">
            <MutedOutlined
              style={{ fontSize: "24px", color: "white" }}
              onClick={() => setIsMuted(!isMuted)}
            />
          </div>
        ) : (
          <SoundOutlined
            style={{ fontSize: "24px", color: "rgba(255, 255, 255, 0.3)" }}
            onClick={() => setIsMuted(!isMuted)}
          />
        )}
        <div className="w-[50px] h-[50px]"></div>
        <MenuUnfoldOutlined
          style={{
            fontSize: "24px",
            color: isQueue ? "white" : "rgba(255, 255, 255, 0.3)",
          }}
          onClick={() => {
            setIsQueue(!isQueue);
            dispatch(setQueueOpen(!isQueue));
          }}
        />
        <ShareAltOutlined
          style={{
            fontSize: "24px",
            color: isShare ? "white" : "rgba(255, 255, 255, 0.3)",
          }}
          onClick={() => setIsShare(!isShare)}
        />
      </motion.div>
    </div>
  );
};
