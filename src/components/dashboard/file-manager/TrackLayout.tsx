import { CaretRightOutlined, PauseOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState, type FC } from "react";
import { useAudioDuration } from "../../../hooks/useAudioDuration";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../../../store";
import { setCurrentTrack } from "../../../state/CurrentTrack.slice";

type Props = {
  trackInfo: {
    name: string;
    artist: string;
  };
  cover: string | null;
  audio: string | null;
};

const TrackLayout: FC<Props> = ({ trackInfo, cover, audio }) => {
  const [hover, setHover] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const duration = useAudioDuration(audio || "");
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const dispatch = useDispatch<AppDispatch>();

  const togglePlayPause = () => {
    if (!audioRef.current) return; // Проверяем, существует ли ссылка

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (currentTrack?.currentTrack?.name !== trackInfo.name) {
        dispatch(setCurrentTrack(trackInfo));
      }
      audioRef.current
        .play()
        .catch((error) => console.error("Ошибка воспроизведения:", error));
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (currentTrack.currentTrack?.name !== trackInfo.name) {
      if (!audioRef.current) return;
      setIsPlaying(false);
      audioRef.current.pause();
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div
      className="flex justify-between items-center w-full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {audio && <audio ref={audioRef} src={audio} />}
      <div className="flex gap-3 justify-center">
        <div
          className="w-[65px] h-[65px] rounded-[10px] bg-cover bg-center flex items-center justify-center relative overflow-hidden group"
          style={
            cover
              ? { backgroundImage: `url(${cover})` }
              : { backgroundColor: "#e6e6e6" }
          }
        >
          {/* Оверлей затемнения */}
          <div
            className={`absolute inset-0 transition bg-black ${
              hover ? "opacity-50" : "opacity-0"
            }`}
            style={{ zIndex: 20 }}
          />

          {/* Иконка play/pause */}
          {hover && (
            <div className="flex items-center justify-center absolute inset-0 z-30">
              {isPlaying ? (
                <PauseOutlined
                  style={{
                    color: "#5cec8c",
                    fontSize: "32px",
                    filter: "drop-shadow(0 2px 8px #222)", // чтобы светилась
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                />
              ) : (
                <CaretRightOutlined
                  style={{
                    color: "#5cec8c",
                    fontSize: "32px",
                    filter: "drop-shadow(0 2px 8px #222)",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-black text-lg font-bold tracking-wider">
            {trackInfo.name != "" ? trackInfo.name : "Your track name"}
          </h1>
          <h1 className="text-sm tracking-wider text-black">
            {trackInfo.artist != "" ? trackInfo.artist : "Your artist name"}
          </h1>
        </div>
      </div>
      <div className="flex items-center pr-5">
        <h1 className="text-black/50 text-lg tracking-wider">
          {duration ? duration : "0:00"}
        </h1>
      </div>
    </div>
  );
};

export default TrackLayout;
