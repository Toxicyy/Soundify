import { useEffect, useState } from "react";
import type { AppState } from "../../../store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import TrackLayout from "./TrackLayout";

export default function TrackQueue() {
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );
  const trackQueue = useSelector((state: AppState) => state.audioQueue.queue);
  const [width, setWidth] = useState(0);
  const queueLength = trackQueue.length;

  useEffect(() => {
    const updateWidth = () => setWidth(pageWidth());
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isMenuOpen]);

  function pageWidth() {
    return (
      (document.documentElement.clientWidth - (isMenuOpen ? 230 : 70)) * 0.47
    );
  }
  return (
    <motion.div
      className="drop-shadow-2xl h-full bg-white rounded-3xl flex min-w-[460px]"
      style={{ width: `${width}px` }}
      initial={{ opacity: 0, y: 300, width: 0 }}
      animate={{
        opacity: 1,
        y: 0,
        width: width,
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        width: { duration: 0.3 },
        opacity: { delay: 0.2 },
      }}
    >
      <div className="py-5 px-5 flex flex-col gap-5 w-full">
        <h1>Your Queue ({queueLength})</h1>
        {trackQueue.map((track) => (
          <TrackLayout
            key={track.id}
            trackInfo={track}
            audio={URL.createObjectURL(track.audio ? track.audio : new Blob())}
            cover={track.preview}
          />
        ))}
      </div>
    </motion.div>
  );
}
