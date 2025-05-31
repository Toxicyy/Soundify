import AddTrack from "../../components/dashboard/file-manager/AddTrack";

export default function FileManager() {
  return (
    <div
      className="flex px-10 py-10 bg-[#F4F4F4]"
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      <AddTrack />
    </div>
  );
}
