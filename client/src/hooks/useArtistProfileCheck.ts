import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useNotification } from "../hooks/useNotification";

export const useArtistProfileCheck = (shouldRedirect: boolean = true) => {
  const navigate = useNavigate();
  const { showInfo } = useNotification();
  const { data: currentUser, isLoading } = useGetUserQuery();

  const hasArtistProfile = !isLoading && currentUser?.artistProfile;

  useEffect(() => {
    if (hasArtistProfile && shouldRedirect) {
      showInfo("Redirecting to your Artist Studio...");
      setTimeout(() => {
        navigate("/artist-studio", { replace: true });
      }, 1000);
    }
  }, [hasArtistProfile, shouldRedirect, navigate, showInfo]);

  return {
    hasArtistProfile,
    isLoading,
    currentUser,
  };
};
