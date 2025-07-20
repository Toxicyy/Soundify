import AddAlbum from "../../../components/dashboard/file-manager/Albums/AddAlbum";

export default function AddAlbumPage() {
  return (
    <div
      className="flex flex-col items-center lg:items-start lg:flex-row px-10 py-10 bg-[#F4F4F4] gap-[2vw] overflow-hidden "
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      <AddAlbum />
    </div>
  );
}
