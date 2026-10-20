import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

describe("Dashboard", () => {
  it("shows the workspace overview without inventing sample records", async () => {
    render(<Dashboard email="ayse@example.com" onSignOut={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /merhaba/i })).toBeInTheDocument();
    expect(screen.getAllByText("Çalışma alanı").length).toBeGreaterThan(0);
    expect(screen.getByText("Toplam rezervasyon")).toBeInTheDocument();
    await screen.findByRole("alert");
    expect(screen.queryByText("₺284.650")).not.toBeInTheDocument();
  });

  it("navigates between database-backed dashboard sections", async () => {
    render(<Dashboard email="ayse@example.com" onSignOut={vi.fn()} />);
    await screen.findByRole("alert");

    const spacesNavigation = screen.getByRole("navigation", { name: "Ana gezinme" });
    fireEvent.click(within(spacesNavigation).getByRole("button", { name: /^Mekânlar/ }));
    expect(screen.getByRole("heading", { name: "Mekânlar" })).toBeInTheDocument();
    expect(screen.getByText("Henüz mekân eklenmedi")).toBeInTheDocument();
    expect(within(spacesNavigation).getByRole("button", { name: /^Mekânlar/ })).toHaveAttribute("aria-current", "page");
  });

  it("opens the Turkish month calendar and marks national holidays", async () => {
    render(<Dashboard email="ayse@example.com" onSignOut={vi.fn()} />);
    await screen.findByRole("alert");

    const navigation = screen.getByRole("navigation", { name: "Ana gezinme" });
    fireEvent.click(within(navigation).getByRole("button", { name: /^Takvim/ }));

    expect(screen.getByRole("heading", { name: "Takvim" })).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("Pzt")).toBeInTheDocument();
    expect(screen.getByText("Cumhuriyet Bayramı")).toBeInTheDocument();
  });

  it("calls the real sign-out handler from the account control", () => {
    const onSignOut = vi.fn();
    render(<Dashboard email="ayse@example.com" onSignOut={onSignOut} />);

    fireEvent.click(screen.getByRole("button", { name: "Oturumu kapat" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
