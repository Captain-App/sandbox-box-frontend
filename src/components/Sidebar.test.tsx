import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

// Mock useAuth
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    signOut: vi.fn(),
  }),
}));

describe("Sidebar Component", () => {
  const onTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders navigation items", () => {
    render(
      <MemoryRouter>
        <Sidebar activeTab="dashboard" onTabChange={onTabChange} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Boxes")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("navigates when a nav item is clicked", () => {
    render(
      <MemoryRouter>
        <Sidebar activeTab="dashboard" onTabChange={onTabChange} />
      </MemoryRouter>,
    );

    const settingsLink = screen.getByText("Settings").closest("a");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("highlights the active tab", () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <Sidebar activeTab="settings" onTabChange={onTabChange} />
      </MemoryRouter>,
    );

    const settingsLink = screen.getByText("Settings").closest("a");
    expect(settingsLink).toHaveClass("text-primary"); // active tab styling
  });

  it("renders sign out button", () => {
    render(
      <MemoryRouter>
        <Sidebar activeTab="dashboard" onTabChange={onTabChange} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });
});
