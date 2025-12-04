import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, isFullyLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isFullyLoaded && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isFullyLoaded, isAdmin, navigate]);

  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};
