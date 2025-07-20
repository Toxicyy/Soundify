import type { Track } from "./TrackData";

export type QueueState = {
  isOpen: boolean;
  queue: Track[];
  currentIndex: number;
  history: Track[];
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  shuffledIndexes: number[];
  currentTrack: Track | null;
  originalQueue: Track[];
};
