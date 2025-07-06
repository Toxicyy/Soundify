import { useParams } from "react-router-dom";
import Header from "../components/Playlist/Header";
import { usePlaylist } from "../hooks/usePlaylist";
import { usePlaylistSave } from "../hooks/usePlaylistSave";

export default function Playlist() {
  const { id } = useParams();
  const {
    playlist,
    hasUnsavedChanges,
    loading,
    error,
    updateLocal,
    fetchPlaylist,
  } = usePlaylist(id);

  return (
    <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
      <Header
        playlist={playlist}
        isLoading={loading}
        updateLocal={updateLocal}
        fetchPlaylist={fetchPlaylist}
      />
    </div>
  );
}
