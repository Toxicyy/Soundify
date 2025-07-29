import React from "react";
import { motion } from "framer-motion";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { Playlist } from "../../../types/Playlist";

interface PlaylistCardProps {
  playlist: Playlist;
  index: number;
  isDeleting: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  index,
  isDeleting,
  onSelect,
  onEdit,
  onDelete,
  onPublish,
}) => {
  return (
    <motion.div
      className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onSelect}
    >
      {/* Cover Image */}
      <div className="relative aspect-square bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
        {playlist.coverUrl ? (
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/default-cover.jpg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <SearchOutlined className="text-2xl text-white/60" />
            </div>
          </div>
        )}

        {/* Draft Badge */}
        {playlist.isDraft && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs bg-yellow-500/80 text-yellow-900 rounded-full font-medium">
              DRAFT
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {playlist.isDraft && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPublish();
              }}
              className="p-2 bg-green-500/60 backdrop-blur-sm rounded-lg hover:bg-green-500/80 transition-colors"
              title="Publish playlist"
            >
              <CheckCircleOutlined className="text-white text-sm" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors"
            title="Edit playlist"
          >
            <EditOutlined className="text-white text-sm" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting}
            className="p-2 bg-red-500/60 backdrop-blur-sm rounded-lg hover:bg-red-500/80 transition-colors disabled:opacity-50"
            title="Delete playlist"
          >
            {isDeleting ? (
              <LoadingOutlined className="text-white text-sm animate-spin" />
            ) : (
              <DeleteOutlined className="text-white text-sm" />
            )}
          </button>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-1 truncate">
          {playlist.name || "Untitled Playlist"}
        </h3>
        <p className="text-white/60 text-sm mb-3 line-clamp-2">
          {playlist.description || "No description"}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {playlist.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {playlist.tags && playlist.tags.length > 3 && (
            <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full">
              +{playlist.tags.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>{playlist.trackCount || 0} tracks</span>
          <span>{playlist.likeCount?.toLocaleString() || 0} likes</span>
        </div>

        {/* Status */}
        <div className="mt-2 text-xs">
          {playlist.isDraft ? (
            <span className="text-yellow-400">
              ● Draft - Not visible to users
            </span>
          ) : (
            <span className="text-green-400">
              ● Published - Visible to users
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlaylistCard;
