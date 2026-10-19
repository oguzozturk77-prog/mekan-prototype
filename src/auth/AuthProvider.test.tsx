import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth, type AuthClient } from "./AuthProvider";

function AuthControls() {
  const auth = useAuth();
  return <div>
    <span>{auth.isLoading ? "yükleniyor" : auth.session?.user.email ?? "oturum yok"}</span>
    <span>{auth.isConfigured ? "bağlı" : "yapılandırılmadı"}</span>
    <span>{auth.recoveryMode ? "şifre yenileme" : "normal"}</span>
    <button onClick={() => void auth.signIn("ayse@example.com", "guclu-sifre-123")}>giriş</button>
    <button onClick={() => void auth.resetPassword("ayse@example.com")}>sıfırla</button>
    <button onClick={() => void auth.updatePassword("yeni-sifre-123")}>şifre güncelle</button>
    <button onClick={() => void auth.signOut()}>çıkış</button>
  </div>;
}

describe("AuthProvider", () => {
  it("restores sessions and delegates sign-in, recovery, password update, and sign-out to Supabase", async () => {
    let authListener: ((event: AuthChangeEvent, session: Session | null) => void) | undefined;
    const unsubscribe = vi.fn();
    const authApi = {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn((listener: (event: AuthChangeEvent, session: Session | null) => void) => {
        authListener = listener;
        return { data: { subscription: { unsubscribe } } };
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    };
    const client = { auth: authApi } as unknown as AuthClient;
    const view = render(<AuthProvider client={client}><AuthControls /></AuthProvider>);

    await waitFor(() => expect(screen.getByText("oturum yok")).toBeInTheDocument());
    expect(screen.getByText("bağlı")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "giriş" }));
    await waitFor(() => expect(authApi.signInWithPassword).toHaveBeenCalledWith({ email: "ayse@example.com", password: "guclu-sifre-123" }));
    fireEvent.click(screen.getByRole("button", { name: "sıfırla" }));
    await waitFor(() => expect(authApi.resetPasswordForEmail).toHaveBeenCalledWith("ayse@example.com", { redirectTo: window.location.origin }));

    const session = { user: { id: "user-1", email: "ayse@example.com" } } as Session;
    act(() => authListener?.("PASSWORD_RECOVERY", session));
    expect(screen.getByText("ayse@example.com")).toBeInTheDocument();
    expect(screen.getByText("şifre yenileme")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "şifre güncelle" }));
    await waitFor(() => expect(authApi.updateUser).toHaveBeenCalledWith({ password: "yeni-sifre-123" }));
    await waitFor(() => expect(screen.getByText("normal")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "çıkış" }));
    await waitFor(() => expect(authApi.signOut).toHaveBeenCalledOnce());

    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("keeps authentication unavailable until project settings are provided", async () => {
    render(<AuthProvider client={null}><AuthControls /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("oturum yok")).toBeInTheDocument());
    expect(screen.getByText("yapılandırılmadı")).toBeInTheDocument();
  });
});
