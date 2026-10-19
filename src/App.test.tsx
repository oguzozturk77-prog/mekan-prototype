import { render, screen } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { AuthProvider, type AuthClient } from "./auth/AuthProvider";

describe("App", () => {
  it("starts on the real sign-in screen when no session or provider is configured", async () => {
    render(<AuthProvider client={null}><App /></AuthProvider>);

    expect(await screen.findByRole("heading", { name: "Tekrar hoş geldiniz." })).toBeInTheDocument();
    expect(screen.getByText(/Supabase proje bilgilerinizi ekleyin/)).toBeInTheDocument();
  });

  it("opens the protected workspace only after restoring an authenticated session", async () => {
    const session = {
      user: {
        id: "user-1",
        email: "ayse.demir@example.com",
        user_metadata: { full_name: "Ayşe Demir" },
      },
    } as unknown as Session;
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
    } as unknown as AuthClient;

    render(<AuthProvider client={client}><App /></AuthProvider>);

    expect(await screen.findByRole("heading", { name: /Merhaba, Ayşe Demir/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tekrar hoş geldiniz." })).not.toBeInTheDocument();
  });
});
