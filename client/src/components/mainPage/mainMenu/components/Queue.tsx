import { CustomerServiceOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useState } from "react";
import { QueueTemplate } from "./QueueTemplate";
import { CurrentTrackTemplate } from "./CurrentTrackTemplate.js";
import { useSelector } from "react-redux";
import type { AppState } from "../../../../store";

export default function Queue({ queueOpen }: { queueOpen: boolean }) {
  const [active, setActive] = useState("Queue");
  const queueState = useSelector((state: AppState) => state.queue);
  const { queue, currentTrack } = queueState;

  return (
    <div className="w-full h-full">
      <div
        className={
          "flex items-center justify-between px-4 mb-[25px] pr-8 transition-all duration-700 " +
          (queueOpen ? "opacity-0 mt-[-17vh]" : "opacity-100")
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
        className={
          "w-full transition-all duration-800 min-h-[37.8vh] bg-[#262534] pr-5 rounded-tl-[60px] " +
          (queueOpen ? "h-[100vh]" : "h-[42vh]")
        }
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
