import { CustomerServiceOutlined } from "@ant-design/icons";
import { useState } from "react";
import { QueueTemplate } from "./QueueTemplate";

const testQueue = [
  {
    id: 1,
    title: "Wrong About Forever",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 2,
    title: "This Time",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
  {
    id: 3,
    title: "Call You Mine",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 4,
    title: "Lavish",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
  {
    id: 5,
    title: "Moonlight Chemistry",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 6,
    title: "Queen",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
  {
    id: 7,
    title: "Wrong About Forever",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 8,
    title: "This Time",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
  {
    id: 9,
    title: "Call You Mine",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 10,
    title: "Lavish",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
  {
    id: 11,
    title: "Moonlight Chemistry",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 12,
    title: "Queen",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
  {
    id: 13,
    title: "Wrong About Forever",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 14,
    title: "This Time",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
  {
    id: 15,
    title: "Call You Mine",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 16,
    title: "Lavish",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
  {
    id: 17,
    title: "Moonlight Chemistry",
    artist: "Jeff Bernatt",
    duration: "3:46",
  },
  {
    id: 18,
    title: "Queen",
    artist: "Jeff Bernatt",
    duration: "3:05",
  },
];

export default function Queue({ queueOpen }: { queueOpen: boolean }) {
  const [active, setActive] = useState("Queue");

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
              "text-3xl font-bold tracking-wider mt-3 " +
              (active === "Queue" ? "text-white" : "text-white/50")
            }
            onClick={() => setActive("Queue")}
          >
            Queue
          </h1>
          {active === "Queue" && (
            <div className="w-15 bg-black h-1 mt-[-5px]"></div>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1
            className={
              "text-3xl font-bold tracking-wider mt-3 " +
              (active === "Friend Activity" ? "text-white" : "text-white/50")
            }
            onClick={() => setActive("Friend Activity")}
          >
            Friend Activity
          </h1>
          {active === "Friend Activity" && (
            <div className="w-35 bg-black h-1 mt-[-5px]"></div>
          )}
        </div>
      </div>
      <div
        className={
          "w-full transition-all duration-800 min-h-[37.8vh] bg-[#262534] pr-5 rounded-tl-[60px] " +
          (queueOpen ? "h-[100vh]" : "h-[42vh]")
        }
      >
        <div className="flex items-center px-8 py-8 gap-3">
          <h1 className="text-white text-md font-medium tracking-widest">
            Next Play
          </h1>
          <CustomerServiceOutlined
            style={{ color: "#5cec8c", fontSize: "24px", marginTop: "-5px" }}
          />
        </div>
        <div
          className="queue-scroll flex flex-col gap-2 overflow-auto px-1 "
          style={{
            maxHeight: queueOpen ? "86vh" : "27.5vh",
            transition: "max-height 0.7s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {testQueue.map((track) => (
            <QueueTemplate key={track.id} track={track} />
          ))}
        </div>
      </div>
    </div>
  );
}
