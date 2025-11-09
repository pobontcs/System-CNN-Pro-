import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Pages
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import HealthCheck from "../pages/HealthCheck";
import MapPage from "../pages/MapPage";
import History from "../pages/History";
import { isAuthed } from "../lib/auth";

function Protected({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}
const variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
};

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* key tells Framer Motion this is a new page */}
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/health" element={<Protected><HealthCheck /></Protected>} />
          <Route path="/map" element={<Protected><MapPage /></Protected>} />
          <Route path="/history" element={<Protected><History /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
