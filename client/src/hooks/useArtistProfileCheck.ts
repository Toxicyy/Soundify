import { useNavigate } from "react-router-dom";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useEffect } from "react";
import { useNotification } from "./useNotification";

/**
 * Hook for checking if user has artist profile
 * Redirects to artist studio if profile exists
 */
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
