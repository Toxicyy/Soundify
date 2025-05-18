import { CaretRightOutlined, PauseOutlined } from "@ant-design/icons";
import { useState, type FC } from "react";

interface QueueTemplateProps {
  track: {
    id: number;
    title: string;
    artist: string;
    duration: string;
  };
}
export const QueueTemplate: FC<QueueTemplateProps> = ({ track }) => {
  const [hover, setHover] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <div
      className="pr-4 pl-8"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-6 justify-center">
            {" "}
            {!hover ? (
              <h1 className="text-white/50">{track.id}.</h1>
            ) : isPlaying ? (
              <PauseOutlined
                style={{
                  color: "#5cec8c",
                  fontSize: "24px",
                  marginTop: "-5px",
                }}
                onClick={() => setIsPlaying(!isPlaying)}
              />
            ) : (
              <CaretRightOutlined
                style={{
                  color: "#5cec8c",
                  fontSize: "24px",
                  marginTop: "-5px",
                }}
                onClick={() => setIsPlaying(!isPlaying)}
              />
            )}
          </span>
          <h1 className="text-white">{track.title}</h1>
        </div>
        <h1 className="text-white/50">{track.duration}</h1>
      </div>
      <h1 className="text-white/50 pl-5.5">{track.artist}</h1>
    </div>
  );
};
