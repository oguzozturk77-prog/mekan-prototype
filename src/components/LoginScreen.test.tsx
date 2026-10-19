import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginScreen from "./LoginScreen";

describe("LoginScreen", () => {
  it("renders the Turkish sign-in form and explains missing provider configuration", () => {
    render(<LoginScreen isConfigured={false} onSignIn={vi.fn()} onResetPassword={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Tekrar hoş geldiniz." })).toBeInTheDocument();
    expect(screen.getByLabelText("E-posta adresi")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Şifre")).toHaveAttribute("type", "password");
    expect(screen.getByRole("status")).toHaveTextContent(".env.local");
  });

  it("submits credentials to the auth adapter and displays a localized provider error", async () => {
    const onSignIn = vi.fn().mockRejectedValue(new Error("Invalid login credentials"));
    render(<LoginScreen isConfigured onSignIn={onSignIn} onResetPassword={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("E-posta adresi"), { target: { value: "ayse@example.com" } });
    fireEvent.change(screen.getByLabelText("Şifre"), { target: { value: "guclu-sifre-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Giriş yap" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-posta adresi veya şifre hatalı.");
    expect(onSignIn).toHaveBeenCalledWith("ayse@example.com", "guclu-sifre-123");
  });

  it("sends a password reset request for the entered email", async () => {
    const onResetPassword = vi.fn().mockResolvedValue(undefined);
    render(<LoginScreen isConfigured onSignIn={vi.fn()} onResetPassword={onResetPassword} />);

    fireEvent.click(screen.getByRole("button", { name: "Şifremi unuttum" }));
    fireEvent.change(screen.getByLabelText("E-posta adresi"), { target: { value: "ayse@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }));

    expect(await screen.findByRole("status")).toHaveTextContent("bağlantısı e-posta adresinize gönderildi");
    expect(onResetPassword).toHaveBeenCalledWith("ayse@example.com");
  });
});
