import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../shared/api";
import { useGetUserQuery } from "../state/UserApi.slice";
import {
  addLike,
  removeLike,
  confirmLikeUpdate,
  revertLikeUpdate,
  selectIsLiked,
  selectIsPending,
} from "../state/LikeUpdate.slice";
import type { AppDispatch, AppState } from "../store";

/**
 * Hook for managing track like/unlike with optimistic updates
 * Automatically rolls back on API errors
 */
export const useLike = (trackId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: user } = useGetUserQuery();

  const isLiked = useSelector((state: AppState) =>
    selectIsLiked(state, trackId)
  );
  const isPending = useSelector((state: AppState) =>
    selectIsPending(state, trackId)
  );

  const toggleLike = useCallback(async () => {
    if (!user?._id || !trackId || isPending) return;

    const wasLiked = isLiked;

    try {
      if (wasLiked) {
        dispatch(removeLike(trackId));
      } else {
        dispatch(addLike(trackId));
      }

      const response = wasLiked
        ? await api.user.unlikeSong(user._id, trackId)
        : await api.user.likeSong(user._id, trackId);

      if (response.ok) {
        dispatch(confirmLikeUpdate(trackId));
      } else {
        dispatch(revertLikeUpdate({ trackId, wasLiked }));
      }
    } catch (error) {
      dispatch(revertLikeUpdate({ trackId, wasLiked }));
    }
  }, [dispatch, user?._id, trackId, isLiked, isPending]);

  return {
    isLiked,
    isPending,
    toggleLike,
  };
};
