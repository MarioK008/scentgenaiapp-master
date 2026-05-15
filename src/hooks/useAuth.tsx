import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const navigate = useNavigate();

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();
      
      const isAdminUser = !!data;
      setIsAdmin(isAdminUser);
      return isAdminUser;
    } catch {
      setIsAdmin(false);
      return false;
    } finally {
      setAdminCheckComplete(true);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Admin role is checked once in initializeAuth.
        // On sign-out we clear it; on sign-in we let initializeAuth or a refresh handle it.
        if (!session?.user) {
          setIsAdmin(false);
          setAdminCheckComplete(true);
        }
      }
    );

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAdminRole(session.user.id);
      } else {
        setAdminCheckComplete(true);
      }
      setLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isFullyLoaded = !loading && adminCheckComplete;

  return {
    user,
    session,
    loading,
    isAdmin,
    adminCheckComplete,
    isFullyLoaded,
    signOut,
  };
};
