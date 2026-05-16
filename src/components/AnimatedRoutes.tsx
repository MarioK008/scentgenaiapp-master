import { ReactNode } from "react";
import { Routes } from "react-router-dom";

interface AnimatedRoutesProps {
  children: ReactNode;
}

/**
 * Renders the app's <Routes>. Per-page fade-in is handled by <AnimatedPage>
 * inside each route, so this wrapper intentionally avoids AnimatePresence +
 * mode="wait" which could leave a route blank if its exit animation collided
 * with auth-driven redirects (the symptom seen on the voice pages).
 */
export const AnimatedRoutes = ({ children }: AnimatedRoutesProps) => {
  return <Routes>{children}</Routes>;
};

export default AnimatedRoutes;
