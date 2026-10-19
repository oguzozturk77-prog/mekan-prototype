import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

export type AuthClient = Pick<SupabaseClient, "auth">;

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  client = supabase,
}: {
  children: ReactNode;
  client?: AuthClient | null;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!client) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
        if (event === "SIGNED_OUT") setRecoveryMode(false);
        setIsLoading(false);
      }
    });

    void client.auth
      .getSession()
      .then(({ data: result }) => {
        if (mounted) setSession(result.session);
      })
      .catch(() => {
        if (mounted) setSession(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      isConfigured: client ? isSupabaseConfigured || client !== supabase : false,
      recoveryMode,
      signIn: async (email, password) => {
        if (!client) throw new Error("Kimlik doğrulama bağlantısı henüz yapılandırılmadı.");
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      resetPassword: async (email) => {
        if (!client) throw new Error("Kimlik doğrulama bağlantısı henüz yapılandırılmadı.");
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
      },
      updatePassword: async (password) => {
        if (!client) throw new Error("Kimlik doğrulama bağlantısı henüz yapılandırılmadı.");
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        setRecoveryMode(false);
      },
      signOut: async () => {
        if (!client) return;
        const { error } = await client.auth.signOut();
        if (error) throw error;
      },
    }),
    [client, isLoading, recoveryMode, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  return context;
}
