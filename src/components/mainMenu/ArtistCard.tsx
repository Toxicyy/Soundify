import TrackLayout from "./TrackLayout";
import lipStick from "../../images/tracks/9mice-LipStick.png";
import narcotic from "../../images/tracks/9mice-narcotic.jpg";
import madam from "../../images/tracks/kaiAngel-madam.jpg";
import ryno from "../../images/tracks/kaiAngel-rynoplastyca.jpg";

export default function ArtistCard({
  artistImage,
  artistName,
}: {
  artistImage: string;
  artistName: string;
}) {
  return (
    <div className="flex justify-between gap-[20px]">
      <div className="flex flex-col items-center gap-2">
        <img
          src={artistImage}
          alt="Artist image"
          className="w-[140px] h-[140px] rounded-[45px]"
        />
        <h1 className="text-black text-lg font-bold tracking-wider">
          {artistName}
        </h1>
      </div>
      {artistName === "9mice" ? (
        <div className="flex flex-col gap-[10px]">
          <TrackLayout
            trackImage={lipStick}
            songName={"LIPSTICK"}
            listenCount={"10 640 312"}
            duration={"1:58"}
          />
          <TrackLayout
            trackImage={narcotic}
            songName={"Narcotic"}
            listenCount={"4 654 327"}
            duration={"2:00"}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          <TrackLayout
            trackImage={madam}
            songName={"Madam"}
            listenCount={"2 914 448"}
            duration={"2:22"}
          />
          <TrackLayout
            trackImage={ryno}
            songName={"Ринопластика - Surgery"}
            listenCount={"5 816 338"}
            duration={"1:55"}
          />
        </div>
      )}
      </div>
  );
}
