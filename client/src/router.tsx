import { createBrowserRouter, Outlet, redirect } from "react-router-dom";
import Main from "./Pages/Main";
import SignUp from "./Pages/SignUp";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import AddTrackPage from "./Pages/Dashboard/FileManage/AddTrackPage";
import AddAlbumPage from "./Pages/Dashboard/FileManage/AddAlbumPage";
import AddArtistPage from "./Pages/Dashboard/FileManage/AddArtistPage";
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
            path: "/radio",
            element: <div>radio</div>,
          },
          {
            path: "/library",
            element: <div>library</div>,
          },
          {
            path: "/liked",
            element: <LikedSongs />,
          },
          {
            path: "/recently",
            element: <div>recently</div>,
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
            element: <CreateAlbumPage />
          }
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
      {
        path: "/dashboard",
        element: <Dashboard />,
        children: [
          {
            path: "statistic",
            element: <div>statistic</div>,
          },
          {
            path: "file-manager",
            children: [
              {
                path: "create-album",
                element: <AddAlbumPage />,
              },
              {
                path: "create-artist",
                element: <AddArtistPage />,
              },
              {
                path: "create-track",
                element: <AddTrackPage />,
              },
            ],
          },
        ],
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
