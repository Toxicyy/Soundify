import AddTrack from "../../components/dashboard/file-manager/AddTrack";
import TrackQueue from "../../components/dashboard/file-manager/TrackQueue";

export default function FileManager() {
  return (
    <div
      className="flex flex-col items-center lg:items-start lg:flex-row px-10 py-10 bg-[#F4F4F4] gap-[2vw] overflow-hidden flex-wrap"
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      <AddTrack />
      <TrackQueue />
    </div>
  );
}
