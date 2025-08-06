import {
  CustomerServiceOutlined,
  PlayCircleOutlined,
  CloseOutlined,
  HeartOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { QueueTemplate } from "./QueueTemplate";
import { CurrentTrackTemplate } from "./CurrentTrackTemplate";
import { useSelector, useDispatch } from "react-redux";
import type { AppState, AppDispatch } from "../../../../store";
import { setQueueOpen } from "../../../../state/Queue.slice";

export default function Queue({ queueOpen }: { queueOpen: boolean }) {
  const [active, setActive] = useState("Queue");
  const [isDesktop, setIsDesktop] = useState(false);
  const queueState = useSelector((state: AppState) => state.queue);
  const { queue, currentTrack } = queueState;
  const dispatch = useDispatch<AppDispatch>();

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Close queue function
  const closeQueue = () => {
    dispatch(setQueueOpen(false));
  };

  // Handle swipe to close (mobile)
  const handleDragEnd = (_event: any, info: PanInfo) => {
    if (info.offset.x > 100 || info.velocity.x > 500) {
      closeQueue();
    }
  };

  // Prevent body scroll when queue is open on mobile
  useEffect(() => {
    if (queueOpen && !isDesktop) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [queueOpen, isDesktop]);

  // Desktop version (xl and up) - ORIGINAL CODE
  if (isDesktop) {
    return (
      <div className="w-full h-full">
        <div
          className={
            "flex items-center justify-between px-4 mb-[25px] pr-8 transition-opacity duration-500 " +
            (queueOpen ? "opacity-0" : "opacity-100")
          }
        >
          <div className="flex flex-col items-center gap-2">
            <h1
              className={
                "text-3xl font-bold tracking-wider mt-3 cursor-pointer " +
                (active === "Queue" ? "text-white" : "text-white/50")
              }
              onClick={() => setActive("Queue")}
            >
              Queue
            </h1>
            {active === "Queue" && (
              <div className="w-15 bg-white/60 h-1 mt-[-5px]"></div>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1
              className={
                "text-3xl font-bold tracking-wider mt-3 cursor-pointer " +
                (active === "Friend Activity" ? "text-white" : "text-white/50")
              }
              onClick={() => setActive("Friend Activity")}
            >
              Friend Activity
            </h1>
            {active === "Friend Activity" && (
              <div className="w-35 bg-white/60 h-1 mt-[-5px]"></div>
            )}
          </div>
        </div>

        <div
          className="w-full bg-[#262534] pr-5 rounded-tl-[60px] overflow-hidden transition-all duration-500 ease-out"
          style={{
            height: queueOpen ? "85vh" : "42vh",
            minHeight: "42vh",
          }}
        >
          {active === "Queue" ? (
            <div className="h-full flex flex-col">
              {/* Playing Now Section */}
              {currentTrack && (
                <div className="flex-shrink-0">
                  <div className="flex items-center px-8 py-6 gap-3">
                    <h1 className="text-white text-md font-medium tracking-widest">
                      Playing Now
                    </h1>
                    <PlayCircleOutlined
                      style={{
                        color: "#5cec8c",
                        fontSize: "20px",
                        marginTop: "-3px",
                      }}
                    />
                  </div>
                  <div className="px-1 mb-4">
                    <CurrentTrackTemplate track={currentTrack} />
                  </div>
                </div>
              )}

              {/* Next Up Section */}
              {queue.length > 0 && (
                <>
                  <div className="flex items-center px-8 py-4 gap-3">
                    <h1 className="text-white text-md font-medium tracking-widest">
                      Next Up
                    </h1>
                    <CustomerServiceOutlined
                      style={{
                        color: "#5cec8c",
                        fontSize: "20px",
                        marginTop: "-3px",
                      }}
                    />
                    <span className="text-white/60 text-sm ml-2">
                      {queue.length} track{queue.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div
                    className="queue-scroll flex flex-col gap-2 overflow-auto px-1 flex-1"
                    style={{
                      maxHeight: queueOpen
                        ? currentTrack
                          ? "70vh"
                          : "86vh"
                        : currentTrack
                        ? "18vh"
                        : "27.5vh",
                      transition: "max-height 0.7s cubic-bezier(.4,0,.2,1)",
                    }}
                  >
                    {queue.map((track, index) => (
                      <QueueTemplate
                        key={`${track._id}-${index}`}
                        track={track}
                        index={index}
                        isInQueue={true}
                        isMobile={false}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Empty State */}
              {!currentTrack && queue.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
                  <CustomerServiceOutlined
                    style={{
                      color: "rgba(255, 255, 255, 0.3)",
                      fontSize: "48px",
                    }}
                    className="mb-4"
                  />
                  <h2 className="text-white/60 text-lg font-medium mb-2">
                    Your queue is empty
                  </h2>
                  <p className="text-white/40 text-sm">
                    Play a track to see it here
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Friend Activity Content - ENHANCED COMING SOON */
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-8">
              <motion.div
                className="relative mb-6"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-2">
                  <UserAddOutlined
                    style={{ color: "#8B5CF6", fontSize: "32px" }}
                  />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className="text-black text-xs font-bold">!</span>
                </motion.div>
              </motion.div>

              <h2 className="text-white/80 text-xl font-bold mb-3">
                Friend Activity
              </h2>
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-4 border border-purple-500/30">
                <p className="text-purple-200 text-sm font-medium mb-1">
                  🎵 Coming Soon!
                </p>
                <p className="text-white/60 text-xs">
                  Connect with friends and discover music together
                </p>
              </div>

              <div className="space-y-2 text-white/50 text-xs">
                <p>• See what your friends are listening to</p>
                <p>• Share your favorite tracks</p>
                <p>• Discover new music together</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile/Tablet overlay version (under xl) - FIXED VERSION
  return (
    <AnimatePresence>
      {queueOpen && (
        <>
          {/* Backdrop for tablet only */}
          {!isDesktop && window.innerWidth >= 768 && (
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeQueue}
            />
          )}

          {/* Mobile/Tablet Queue Panel */}
          <motion.div
            className={`fixed z-50 flex flex-col ${
              window.innerWidth < 768
                ? "inset-0" // Mobile: full screen
                : "inset-y-0 right-0 w-[60%]" // Tablet: 40% width
            }`}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              duration: 0.4,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/95 via-[#16213e]/90 to-[#0f0f23]/95 backdrop-blur-xl" />

            {/* Drag indicator for mobile */}
            {window.innerWidth < 768 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full" />
            )}

            {/* Header */}
            <div className="relative flex items-center justify-between p-4 md:p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: active === "Queue" ? 0 : 360,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {active === "Queue" ? (
                    <CustomerServiceOutlined
                      style={{ color: "#5cec8c", fontSize: "24px" }}
                    />
                  ) : (
                    <UserAddOutlined
                      style={{ color: "#8B5CF6", fontSize: "24px" }}
                    />
                  )}
                </motion.div>
                <h1 className="text-white text-xl md:text-2xl font-bold tracking-wider">
                  {active}
                </h1>
                {active === "Queue" && queue.length > 0 && (
                  <span className="bg-[#5cec8c]/20 text-[#5cec8c] text-xs px-2 py-1 rounded-full">
                    {queue.length}
                  </span>
                )}
              </div>

              <motion.button
                onClick={closeQueue}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <CloseOutlined style={{ color: "white", fontSize: "18px" }} />
              </motion.button>
            </div>

            {/* Tab selector */}
            <div className="relative flex bg-white/5 m-4 rounded-2xl p-1">
              <motion.div
                className="absolute top-1 bottom-1 bg-[#5cec8c]/20 rounded-xl border border-[#5cec8c]/30"
                initial={false}
                animate={{
                  x: active === "Queue" ? "0%" : "100%",
                  width: "calc(50% - 4px)",
                }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 300,
                  duration: 0.3,
                }}
              />
              <button
                className={`relative flex-1 py-3 text-center font-medium transition-colors ${
                  active === "Queue" ? "text-[#5cec8c]" : "text-white/60"
                }`}
                onClick={() => setActive("Queue")}
              >
                Queue
              </button>
              <button
                className={`relative flex-1 py-3 text-center font-medium transition-colors ${
                  active === "Friend Activity"
                    ? "text-[#5cec8c]"
                    : "text-white/60"
                }`}
                onClick={() => setActive("Friend Activity")}
              >
                Friends
              </button>
            </div>

            {/* Content */}
            <div className="relative flex-1 overflow-hidden">
              {active === "Queue" ? (
                <div className="h-full p-4 flex flex-col">
                  {/* Playing Now Section */}
                  {currentTrack && (
                    <div className="flex-shrink-0 mb-4">
                      <div className="flex items-center py-3 gap-3 border-b border-white/10">
                        <PlayCircleOutlined
                          style={{ color: "#5cec8c", fontSize: "20px" }}
                        />
                        <h1 className="text-white text-sm font-medium tracking-widest">
                          Now Playing
                        </h1>
                      </div>
                      <div className="mt-3">
                        <CurrentTrackTemplate track={currentTrack} />
                      </div>
                    </div>
                  )}

                  {/* Next Up Section */}
                  {queue.length > 0 ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center py-3 gap-3 border-b border-white/10">
                        <CustomerServiceOutlined
                          style={{ color: "#5cec8c", fontSize: "20px" }}
                        />
                        <h1 className="text-white text-sm font-medium tracking-widest">
                          Next Up
                        </h1>
                        <span className="text-white/60 text-xs">
                          {queue.length} track{queue.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="queue-scroll flex flex-col gap-2 overflow-auto flex-1 mt-3 pr-2">
                        {queue.map((track, index) => (
                          <QueueTemplate
                            key={`${track._id}-${index}`}
                            track={track}
                            index={index}
                            isInQueue={true}
                            isMobile={true}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Empty Queue State */
                    !currentTrack && (
                      <div className="flex flex-col items-center justify-center flex-1 text-center">
                        <motion.div
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5cec8c]/20 to-[#5cec8c]/5 flex items-center justify-center mb-4"
                          animate={{
                            scale: [1, 1.05, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <CustomerServiceOutlined
                            style={{ color: "#5cec8c", fontSize: "24px" }}
                          />
                        </motion.div>
                        <h2 className="text-white/80 text-lg font-semibold mb-2">
                          Your queue is empty
                        </h2>
                        <p className="text-white/50 text-sm mb-4">
                          Play a track to start building your queue
                        </p>
                        <div className="bg-[#5cec8c]/10 rounded-lg p-3 border border-[#5cec8c]/20">
                          <p className="text-[#5cec8c] text-xs">
                            💡 Tip: Tracks you play will appear here in order
                          </p>
                        </div>
                      </div>
                    )
                  )}

                  {/* Only current track, no queue */}
                  {currentTrack && queue.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 text-center mt-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mb-3">
                        <HeartOutlined
                          style={{ color: "#f59e0b", fontSize: "20px" }}
                        />
                      </div>
                      <h3 className="text-white/70 text-base font-medium mb-2">
                        No upcoming tracks
                      </h3>
                      <p className="text-white/50 text-sm">
                        Add more songs to keep the music going
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Friend Activity Content */
                <div className="h-full p-4 flex flex-col items-center justify-center text-center">
                  <motion.div
                    className="relative mb-6"
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <UserAddOutlined
                        style={{ color: "#8B5CF6", fontSize: "32px" }}
                      />
                    </div>

                    {/* Floating notification badge */}
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
                      animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 15, -15, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <span className="text-black text-xs font-bold">🎵</span>
                    </motion.div>

                    {/* Floating hearts */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-pink-400"
                        style={{
                          left: `${20 + i * 15}px`,
                          top: `${10 + i * 5}px`,
                        }}
                        animate={{
                          y: [-5, -15, -5],
                          opacity: [0.5, 1, 0.5],
                          scale: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.5,
                        }}
                      >
                        <HeartOutlined style={{ fontSize: "12px" }} />
                      </motion.div>
                    ))}
                  </motion.div>

                  <h2 className="text-white/90 text-xl font-bold mb-3">
                    Friend Activity
                  </h2>

                  <motion.div
                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-4 border border-purple-500/30"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(139, 92, 246, 0.3)",
                        "0 0 30px rgba(139, 92, 246, 0.5)",
                        "0 0 20px rgba(139, 92, 246, 0.3)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <p className="text-purple-200 text-sm font-bold mb-1">
                      🚀 Coming Soon!
                    </p>
                    <p className="text-white/70 text-xs">
                      Connect with friends and discover music together
                    </p>
                  </motion.div>

                  <div className="space-y-2 text-white/60 text-xs">
                    <p>🎧 See what your friends are listening to</p>
                    <p>📱 Share your favorite tracks instantly</p>
                    <p>🎵 Discover new music together</p>
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-6 w-full max-w-[200px]">
                    <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "60%" }}
                        transition={{ duration: 2, delay: 1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-white/50 text-xs mt-2">60% Complete</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
