import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResetPasswordScreen from "./ResetPasswordScreen";

describe("ResetPasswordScreen", () => {
  it("rejects mismatched passwords without calling the provider", async () => {
    const onUpdatePassword = vi.fn();
    render(<ResetPasswordScreen onUpdatePassword={onUpdatePassword} />);

    fireEvent.change(screen.getByLabelText("Yeni şifre"), { target: { value: "guclu-sifre-123" } });
    fireEvent.change(screen.getByLabelText("Yeni şifre tekrar"), { target: { value: "farkli-sifre-456" } });
    fireEvent.click(screen.getByRole("button", { name: "Şifremi güncelle" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/şifreler birbiriyle eşleşmiyor/);
    expect(onUpdatePassword).not.toHaveBeenCalled();
  });
});
