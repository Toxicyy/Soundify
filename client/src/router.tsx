import { createBrowserRouter, Outlet, redirect } from "react-router-dom";
import Main from "./Pages/Main";
import SignUp from "./Pages/SignUp";
import Login from "./Pages/Login";
import MainMenu from "./components/mainPage/mainMenu/MainMenu";
import LikedSongs from "./Pages/LikedSongs";
import Artist from "./Pages/Artist";
import Album from "./Pages/Album";
import Single from "./Pages/Single";
import Playlist from "./Pages/Playlist";
import Profile from "./Pages/Profile";
import UserPlaylistsPage from "./Pages/Profile/UserPlaylistsPage";
import UserLikedPlaylistsPage from "./Pages/Profile/UserLikedPlaylistsPage";
import UserLikedArtistsPage from "./Pages/Profile/UserLikedArtistsPage";
import BecomeAnArtist from "./Pages/BecomeAnArtist";
import ArtistStudio from "./Pages/ArtistStudio";
import CreateAlbumPage from "./Pages/CreateAlbumPage";
import TrackPage from "./Pages/TrackPage";
import AdminPlatformPlaylists from "./Pages/Admin/AdminPlatfromPlaylists";
import {
  AdminAnalytics,
  AdminContent,
  AdminModeration,
  AdminReports,
  AdminUsers,
} from "./Pages/Admin/AdminComingSoon";
import AdminGuard from "./Pages/Admin/AdminGuard";
import AdminPanel from "./Pages/Admin/AdminPanel";
import Playlists from "./Pages/Playlists";
import Artists from "./Pages/Artists";
import Recently from "./Pages/Recently";
import Premium from "./Pages/Premium";
import Search from "./Pages/Search";
import Charts from "./Pages/Charts";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        path: "/",
        element: <Main />,
        children: [
          {
            path: "/",
            element: <MainMenu />,
          },
          {
            path: "/playlists",
            element: <Playlists />,
          },
          {
            path: "/artists",
            element: <Artists />,
          },
          {
            path: "/liked",
            element: <LikedSongs />,
          },
          {
            path: "/recently",
            element: <Recently />,
          },
          {
            path: "/playlist/:id",
            element: <Playlist />,
          },
          {
            path: "/artist/:id",
            element: <Artist />,
          },
          {
            path: "/album/:id",
            element: <Album />,
          },
          {
            path: "/single/:id",
            element: <Single />,
          },
          {
            path: "/profile/:id",
            element: <Profile />,
          },
          // Переместил дочерние роуты профиля на один уровень с основным роутом профиля
          {
            path: "/profile/:id/playlists",
            element: <UserPlaylistsPage />,
          },
          {
            path: "/profile/:id/liked-playlists",
            element: <UserLikedPlaylistsPage />,
          },
          {
            path: "/profile/:id/artists",
            element: <UserLikedArtistsPage />,
          },
          {
            path: "/become-an-artist",
            element: <BecomeAnArtist />,
          },
          {
            path: "/artist-studio",
            element: <ArtistStudio />,
          },
          {
            path: "/artist-studio/create-album",
            element: <CreateAlbumPage />,
          },
          {
            path: "/track/:id",
            element: <TrackPage />,
          },
          {
            path: "/upgrade-to-premium",
            element: <Premium />,
          },
          {
            path: "/search",
            element: <Search />,
          },
          {
            path: "/charts",
            element: <Charts />,
          },
        ],
      },
      {
        path: "/signup",
        element: <SignUp />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      // Admin Routes - Protected by AdminGuard
      {
        path: "/admin",
        element: (
          <AdminGuard>
            <AdminPanel />
          </AdminGuard>
        ),
      },
      {
        path: "/admin/playlists",
        element: (
          <AdminGuard>
            <AdminPlatformPlaylists />
          </AdminGuard>
        ),
      },
      {
        path: "/admin/analytics",
        element: (
          <AdminGuard>
            <AdminAnalytics />
          </AdminGuard>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <AdminGuard>
            <AdminUsers />
          </AdminGuard>
        ),
      },
      {
        path: "/admin/content",
        element: (
          <AdminGuard>
            <AdminContent />
          </AdminGuard>
        ),
      },
      {
        path: "/admin/reports",
        element: (
          <AdminGuard>
            <AdminReports />
          </AdminGuard>
        ),
      },
      {
        path: "/admin/moderation",
        element: (
          <AdminGuard>
            <AdminModeration />
          </AdminGuard>
        ),
      },
      {
        path: "*",
        loader: () => {
          return redirect("/discover");
        },
      },
    ],
  },
]);
