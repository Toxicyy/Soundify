import { type FC, memo } from "react";
import type { Track } from "../../types/TrackData";
import TracksList from "./components/TrackList";

interface AlbumMainMenuProps {
  tracks: Track[];
  isLoading: boolean;
  tracksError?: string | null;
}

/**
 * Album main menu component displaying track list with controls
 * Features responsive design, loading states, and comprehensive track management
 */
const AlbumMainMenu: FC<AlbumMainMenuProps> = ({
  tracks,
  isLoading,
  tracksError = null,
}) => {
  return (
    <main className="min-h-[62vh] w-full bg-white/10 rounded-3xl border border-white/20">
      <TracksList
        tracks={tracks}
        isLoading={isLoading}
        tracksError={tracksError}
      />

      {/* Additional context for screen readers */}
      {!isLoading && tracks.length > 0 && (
        <div className="sr-only">
          <h2>
            Album contains {tracks.length}{" "}
            {tracks.length === 1 ? "track" : "tracks"}
          </h2>
          <p>
            Use the search feature to find specific tracks within this album
          </p>
        </div>
      )}
    </main>
  );
};

export default memo(AlbumMainMenu);
