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

  const handleTest = () => {
    console.log(trackQueue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < trackQueue.length; i++) {
      const track = trackQueue[i];

      if (!track.audio || !track.cover) {
        console.error("Missing audio or cover file for track:", track.name);
        errorCount++;
        continue;
      }

      const formData = new FormData();
      formData.append("name", track.name);
      formData.append("artist", track.artist);
      formData.append("audio", track.audio);
      formData.append("cover", track.cover);

      try {
        console.log(
          `Uploading track ${i + 1}/${trackQueue.length}:`,
          track.name
        );

        const response = await fetch("http://localhost:5000/api/tracks", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Track uploaded successfully:", data);
          successCount++;
        } else {
          const errorData = await response.json();
          console.error("Upload failed:", errorData);
          errorCount++;
        }
      } catch (err) {
        console.error("Network error:", err);
        errorCount++;
      }
    }

    // Показать результат загрузки
    if (successCount > 0) {
      console.log(`Successfully uploaded ${successCount} tracks`);
    }
    if (errorCount > 0) {
      console.error(`Failed to upload ${errorCount} tracks`);
    }
  };
  return (
    <motion.div
      className="drop-shadow-2xl h-full bg-white rounded-3xl min-w-[460px]"
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
      <button
        disabled={queueLength === 0}
        className={`px-4 py-2 text-white mx-5 mb-4 rounded-md transition-colors ${
          queueLength === 0 ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
        }`}
        onClick={handleSubmit}
      >
        Upload All ({queueLength})
      </button>
    </motion.div>
  );
}
