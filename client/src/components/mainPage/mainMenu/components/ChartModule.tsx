import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrophyOutlined, PlayCircleOutlined } from "@ant-design/icons";

export default function ChartModule({ chartImage }: { chartImage: string }) {
  const [hover, setHover] = useState(false);
  const chartName = "Global chart";
  const navigate = useNavigate();

  useEffect(() => {
    console.log(hover)
  }, [hover]);

  // Mobile/Tablet Layout (Spotify-style)
  const MobileTabletLayout = () => (
    <div className="w-full">
      <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider mb-3 md:mb-4 px-2 md:px-0">
        Global chart
      </h1>

      <motion.div
        className="bg-gradient-to-br from-[#1db954]/20 to-[#191414]/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 cursor-pointer transition-all duration-300"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => navigate("/charts")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          {/* Chart Icon/Image */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={chartImage}
              alt="Global Chart"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Trophy overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <TrophyOutlined
                style={{
                  color: "#FFD700",
                  fontSize: "24px",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-lg md:text-xl font-bold tracking-wider mb-1">
              {chartName}
            </h2>
            <p className="text-white/60 text-sm md:text-base">
              Top tracks worldwide
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#1db954] rounded-full animate-pulse"></div>
                <span className="text-[#1db954] text-xs font-medium">
                  Updated daily
                </span>
              </div>
            </div>
          </div>

          {/* Play button */}
          {hover && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0"
            >
              <div className="w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg">
                <PlayCircleOutlined
                  style={{ fontSize: "20px", color: "black" }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );

  // Desktop Layout (Original)
  const DesktopLayout = () => (
    <div>
      <h1 className="text-3xl font-bold text-white tracking-wider mt-2 mb-[15px]">
        Global chart
      </h1>
      <div
        className={
          "w-[100%] h-[35vh] rounded-3xl glass flex pl-10 pr-10 pb-4 items-end duration-500 cursor-pointer transition-all justify-between " +
          (hover
            ? "contrast-100 drop-shadow-[0_7px_7px_rgba(0,0,0,0.4)]"
            : "contrast-50")
        }
        style={{
          backgroundImage: `url(${chartImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => navigate("/charts")}
      >
        {hover && (
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-white text-4xl font-bold tracking-wider">
              {chartName}
            </h1>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile and Tablet */}
      <div className="block xl:hidden">
        <MobileTabletLayout />
      </div>

      {/* Desktop */}
      <div className="hidden xl:block">
        <DesktopLayout />
      </div>
    </>
  );
}
