import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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
    render(<Sidebar activeTab="dashboard" onTabChange={onTabChange} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Boxes")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("calls onTabChange when a nav item is clicked", () => {
    render(<Sidebar activeTab="dashboard" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText("Settings"));
    expect(onTabChange).toHaveBeenCalledWith("settings");
  });

  it("highlights the active tab", () => {
    render(<Sidebar activeTab="settings" onTabChange={onTabChange} />);

    const settingsButton = screen.getByText("Settings").closest("button");
    expect(settingsButton).toHaveClass("text-primary"); // active tab styling
  });

  it("renders sign out button", () => {
    render(<Sidebar activeTab="dashboard" onTabChange={onTabChange} />);
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });
});
