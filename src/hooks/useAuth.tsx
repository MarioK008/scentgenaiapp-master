import { useEffect, useState, useCallback } from "react";
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

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();
      
      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setAdminCheckComplete(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkAdminRole(session.user.id);
        } else {
          setAdminCheckComplete(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAdminCheckComplete(true);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setAdminCheckComplete(false);
          await checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
          setAdminCheckComplete(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminCheckComplete(false);
    navigate("/auth");
  };

  // Only consider loading complete when both auth and admin check are done
  const isFullyLoaded = !loading && adminCheckComplete;

  return {
    user,
    session,
    loading: !isFullyLoaded,
    isAdmin,
    signOut,
  };
};
