import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

describe("Dashboard", () => {
  it("shows the authenticated overview and sample metrics", () => {
    render(<Dashboard email="ayse@example.com" onSignOut={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /merhaba/i })).toBeInTheDocument();
    expect(screen.getByText(/Örnek çalışma alanı/)).toBeInTheDocument();
    expect(screen.getByText("Toplam rezervasyon")).toBeInTheDocument();
    expect(screen.getByText("₺284.650")).toBeInTheDocument();
  });

  it("navigates between dashboard sections", () => {
    render(<Dashboard email="ayse@example.com" onSignOut={vi.fn()} />);

    const spacesNavigation = screen.getByRole("navigation", { name: "Ana gezinme" });
    fireEvent.click(within(spacesNavigation).getByRole("button", { name: /^Mekânlar/ }));
    expect(screen.getByRole("heading", { name: "Mekânlar" })).toBeInTheDocument();
    expect(screen.getByText("Kıyı Loft")).toBeInTheDocument();
    expect(within(spacesNavigation).getByRole("button", { name: /^Mekânlar/ })).toHaveAttribute("aria-current", "page");
  });

  it("calls the real sign-out handler from the account control", () => {
    const onSignOut = vi.fn();
    render(<Dashboard email="ayse@example.com" onSignOut={onSignOut} />);

    fireEvent.click(screen.getByRole("button", { name: "Oturumu kapat" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
