import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string, token: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://app.captainapp.co.uk"}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&select=role`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey:
              import.meta.env.VITE_SUPABASE_ANON_KEY ||
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmNqa2loeHNrdXd3ZmRxa2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU2OTAsImV4cCI6MjA2NjI4MTY5MH0.V9e7XsuTlTOLqefOIedTqlBiTxUSn4O5FZSPWwAxiSI",
          },
        },
      );
      if (res.ok) {
        const roles = (await res.json()) as any[];
        setIsAdmin(roles.length > 0);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      console.error("Error checking admin role:", e);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session.access_token) {
        await checkAdminRole(session.user.id, session.access_token);
      }
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session.access_token) {
        await checkAdminRole(session.user.id, session.access_token);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
