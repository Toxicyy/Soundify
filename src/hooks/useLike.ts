import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
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
      // Оптимистичное обновление UI
      if (wasLiked) {
        dispatch(removeLike(trackId));
      } else {
        dispatch(addLike(trackId));
      }

      // Отправка запроса на сервер
      const url = `http://localhost:5000/api/users/${user._id}/${
        wasLiked ? "unlike" : "like"
      }/${trackId}`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        // Подтверждаем успешное обновление
        dispatch(confirmLikeUpdate(trackId));
      } else {
        // Откатываем изменения при ошибке
        dispatch(revertLikeUpdate({ trackId, wasLiked }));
        console.error("Ошибка при обновлении лайка:", await response.json());
      }
    } catch (error) {
      // Откатываем изменения при ошибке сети
      dispatch(revertLikeUpdate({ trackId, wasLiked }));
      console.error("Ошибка сети при обновлении лайка:", error);
    }
  }, [dispatch, user?._id, trackId, isLiked, isPending]);

  return {
    isLiked,
    isPending,
    toggleLike,
  };
};
