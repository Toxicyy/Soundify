import { createBrowserRouter, Outlet, redirect } from "react-router-dom";
import Main from "./Pages/Main";
import SignUp from "./Pages/SignUp";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import AddTrackPage from "./Pages/Dashboard/FileManage/AddTrackPage";
import AddAlbumPage from "./Pages/Dashboard/FileManage/AddAlbumPage";
import AddArtistPage from "./Pages/Dashboard/FileManage/AddArtistPage";
import MainMenu from "./components/mainMenu/MainMenu";

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
            element: <div>liked</div>,
          },
          {
            path: "/recently",
            element: <div>recently</div>,
          },
          {
            path: "/playlist",
            element: <div>playlist</div>,
          },
        ]
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
