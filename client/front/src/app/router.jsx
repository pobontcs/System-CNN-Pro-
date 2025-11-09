import { createBrowserRouter, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import HealthCheck from "../pages/HealthCheck";
import MapPage from "../pages/MapPage";
import History from "../pages/History";

import { isAuthed } from "../lib/auth";

// minimal guard
function Protected({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/dashboard", element: <Protected><Dashboard /></Protected> },
  { path: "/health", element: <Protected><HealthCheck /></Protected> },
  { path: "/map", element: <Protected><MapPage /></Protected> },
  { path: "/history", element: <Protected><History /></Protected> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
