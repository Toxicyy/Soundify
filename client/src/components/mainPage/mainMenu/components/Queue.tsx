import {
  CustomerServiceOutlined,
  PlayCircleOutlined,
  CloseOutlined,
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
                        key={track._id}
                        track={track}
                        index={index}
                        isInQueue={true}
                        isMobile={window.innerWidth < 768}
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
            /* Friend Activity Content */
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <CustomerServiceOutlined
                style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "48px" }}
                className="mb-4"
              />
              <h2 className="text-white/60 text-lg font-medium mb-2">
                Friend Activity
              </h2>
              <p className="text-white/40 text-sm">
                See what your friends are listening to
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile/Tablet overlay version (under xl)
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
                : "inset-y-0 right-0 w-[40%]" // Tablet: 40% width
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
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full z-10" />
            )}

            {/* Header */}
            <div className="relative flex items-center justify-between p-4 md:p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <CustomerServiceOutlined
                  style={{ color: "#5cec8c", fontSize: "24px" }}
                />
                <h1 className="text-white text-xl md:text-2xl font-bold tracking-wider">
                  Queue
                </h1>
                {queue.length > 0 && (
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
                animate={{
                  left: active === "Queue" ? "4px" : "50%",
                  right: active === "Queue" ? "50%" : "4px",
                }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              />
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors relative z-10 ${
                  active === "Queue" ? "text-[#5cec8c]" : "text-white/60"
                }`}
                onClick={() => setActive("Queue")}
              >
                Queue
              </button>
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors relative z-10 ${
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
            <div className="flex-1 overflow-hidden p-4">
              {active === "Queue" ? (
                <div className="h-full flex flex-col">
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
                  {queue.length > 0 && (
                    <div className="flex-1 flex flex-col">
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

                      <div className="queue-scroll flex flex-col gap-2 overflow-auto flex-1 mt-3">
                        {queue.map((track, index) => (
                          <QueueTemplate
                            key={track._id}
                            track={track}
                            index={index}
                            isInQueue={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!currentTrack && queue.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5cec8c]/20 to-[#5cec8c]/5 flex items-center justify-center mb-4">
                        <CustomerServiceOutlined
                          style={{ color: "#5cec8c", fontSize: "24px" }}
                        />
                      </div>
                      <h2 className="text-white/80 text-lg font-semibold mb-2">
                        Your queue is empty
                      </h2>
                      <p className="text-white/50 text-sm">
                        Play a track to see it here
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Friend Activity Content */
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <CustomerServiceOutlined
                      style={{ color: "#8B5CF6", fontSize: "24px" }}
                    />
                  </div>
                  <h2 className="text-white/80 text-lg font-semibold mb-2">
                    Friend Activity
                  </h2>
                  <p className="text-white/50 text-sm">
                    Connect with friends to see what they're listening to
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
