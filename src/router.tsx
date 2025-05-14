import { createBrowserRouter, Outlet, redirect } from "react-router-dom";
import Main from "./Pages/Main";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        path: "/",
        element: <Main />,
      },
      {
        path: "*",
        loader: () => {
          return redirect("/");
        },
      },
    ],
  },
]);
