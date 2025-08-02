import React, { useState, useCallback, useEffect } from "react";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { Playlist } from "../../../types/Playlist";
import type { Track } from "../../../types/TrackData";
import { api } from "../../../shared/api";
import { useNotification } from "../../../hooks/useNotification";
import PlaylistForm from "./PlaylistForm";
import TrackManager from "./TrackManager";

interface PlaylistEditorProps {
  playlist: Playlist;
  isCreating: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSave: (playlist: Playlist) => void;
}

const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
  playlist,
  isCreating,
  isEditing,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: playlist?.name || "",
    description: playlist?.description || "",
    tags: playlist?.tags || [],
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const { showSuccess, showError, showInfo } = useNotification();

  // Initialize tracks from playlist if editing existing playlist
  useEffect(() => {
    const loadTracks = async () => {
      if (playlist?.tracks && Array.isArray(playlist.tracks) && !isCreating) {
        const trackObjects = playlist.tracks.filter(
          (track) =>
            typeof track === "object" && track !== null && "_id" in track
        ) as Track[];

        if (trackObjects.length > 0) {
          setTracks(trackObjects);
        } else if (playlist.tracks.length > 0) {
          try {
            const trackIds = playlist.tracks as string[];
            console.log("Loading tracks by IDs:", trackIds);

            const response = await api.track.getMultipleById(trackIds);

            if (response.ok) {
              const data = await response.json();
              const validTracks = data.data.filter(
                (track: any) => track !== null
              );

              console.log("Loaded tracks:", validTracks);
              setTracks(validTracks);
            } else {
              throw new Error("Failed to fetch tracks");
            }
          } catch (error) {
            console.error("Error loading tracks:", error);
            showError("Failed to load playlist tracks");
          }
        }
      }
    };

    loadTracks();
  }, [playlist, isCreating]);

  const handleFormChange = useCallback(
    (
      updates: Partial<{
        name: string;
        description: string;
        tags: string[];
      }>
    ) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleTracksChange = useCallback((newTracks: Track[]) => {
    setTracks(newTracks);
  }, []);

  const handleSave = useCallback(
    async (shouldPublish = false) => {
      if (!formData.name.trim()) {
        showError("Playlist name is required");
        return;
      }

      const saveAction = shouldPublish ? setIsPublishing : setIsSaving;
      saveAction(true);

      try {
        const requestData = {
          name: formData.name.trim(),
          description: formData.description || "",
          tags: formData.tags,
          tracks: tracks.map((t) => t._id),
          category: "featured",
          privacy: "public",
          publish: false,
        };

        if (shouldPublish) {
          requestData.publish = true;
        }

        console.log("Отправляемые данные:", requestData);

        let response;

        if (coverFile) {
          const formDataToSend = new FormData();
          formDataToSend.append("name", requestData.name);
          formDataToSend.append("description", requestData.description);
          formDataToSend.append("category", requestData.category);
          formDataToSend.append("privacy", requestData.privacy);
          formDataToSend.append("tags", JSON.stringify(requestData.tags));
          formDataToSend.append("tracks", JSON.stringify(requestData.tracks));

          if (shouldPublish) {
            formDataToSend.append("publish", "true");
          }

          formDataToSend.append("cover", coverFile);

          if (isCreating) {
            response = await api.admin.playlist.create(formDataToSend);
          } else {
            response = await api.admin.playlist.update(
              playlist._id,
              formDataToSend
            );
          }
        } else {

          if (isCreating) {
            response = await api.admin.playlist.createPlatform(requestData);
          } else {
            response = await api.admin.playlist.updatePlatform(
              playlist._id,
              requestData
            );
          }
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save playlist");
        }

        const result = await response.json();

        if (shouldPublish) {
          if (isCreating) {
            showSuccess(
              "Platform playlist created and published successfully!"
            );
          } else {
            showSuccess("Platform playlist published successfully!");
          }
        } else {
          if (isCreating) {
            showSuccess("Platform playlist draft created successfully!");
          } else {
            showSuccess("Platform playlist updated successfully!");
          }
          showInfo(
            "Playlist saved as draft. Use 'Publish' to make it visible to users."
          );
        }

        onSave(result.data);
      } catch (error: any) {
        console.error("Save error:", error);
        showError(error.message || "Failed to save playlist");
      } finally {
        saveAction(false);
      }
    },
    [
      formData,
      tracks,
      coverFile,
      isCreating,
      playlist,
      onSave,
      showSuccess,
      showError,
      showInfo,
    ]
  );

  const canSave = formData.name.trim().length > 0;
  const canPublish = canSave && tracks.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeftOutlined className="text-white text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isCreating
                  ? "Create Platform Playlist"
                  : isEditing
                  ? "Edit Platform Playlist"
                  : "View Platform Playlist"}
              </h1>
              <p className="text-white/70 mt-1">
                {isCreating
                  ? "Build a new curated playlist for the platform"
                  : isEditing
                  ? `Editing "${playlist?.name}"`
                  : `Viewing "${playlist?.name}"`}
                {playlist?.isDraft && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                    DRAFT
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving || isPublishing}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            {(isCreating || isEditing) && (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={!canSave || isSaving || isPublishing}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    canSave && !isSaving && !isPublishing
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                      : "bg-white/10 text-white/50 cursor-not-allowed"
                  }`}
                >
                  {isSaving ? (
                    <LoadingOutlined className="animate-spin" />
                  ) : (
                    <SaveOutlined />
                  )}
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={!canPublish || isSaving || isPublishing}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    canPublish && !isSaving && !isPublishing
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                      : "bg-white/10 text-white/50 cursor-not-allowed"
                  }`}
                >
                  {isPublishing ? (
                    <LoadingOutlined className="animate-spin" />
                  ) : (
                    <CheckCircleOutlined />
                  )}
                  Publish
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Playlist Form */}
          <div className="lg:col-span-1">
            <PlaylistForm
              formData={formData}
              tracks={tracks}
              coverFile={coverFile}
              setCoverFile={setCoverFile}
              onFormChange={handleFormChange}
              isEditing={isCreating || isEditing}
              initialCoverUrl={playlist?.coverUrl}
              canPublish={canPublish}
            />
          </div>

          {/* Track Management */}
          <div className="lg:col-span-2">
            <TrackManager
              tracks={tracks}
              onTracksChange={handleTracksChange}
              isEditing={isCreating || isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistEditor;
