import AddTrack from "../../../components/dashboard/file-manager/Tracks/AddTrack";
import TrackQueue from "../../../components/dashboard/file-manager/Tracks/TrackQueue";

export default function AddTrackPage() {
  return (
    <div
      className="flex flex-col items-center lg:items-start lg:flex-row px-10 py-10 bg-[#F4F4F4] gap-[2vw] overflow-hidden "
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      <AddTrack />
      <TrackQueue />
    </div>
  );
}
