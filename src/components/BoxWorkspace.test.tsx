import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { BoxWorkspace } from "./BoxWorkspace";

describe("BoxWorkspace Component", () => {
  const sandbox = {
    id: "sb-1",
    title: "Test Box",
    status: "active",
    webUiUrl: "https://preview.shipbox.dev/sb-1",
  };
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollBy/scrollTo
    Element.prototype.scrollTo = vi.fn();
  });

  it("renders the header and back button", () => {
    render(
      <MemoryRouter>
        <BoxWorkspace sandbox={sandbox as any} onClose={onClose} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getAllByText("Test Box").length).toBeGreaterThan(0);
  });

  it("renders the chat panel and iframe", () => {
    render(
      <MemoryRouter>
        <BoxWorkspace sandbox={sandbox as any} onClose={onClose} />
      </MemoryRouter>,
    );

    expect(
      screen.getAllByPlaceholderText(/Ask your agent.../i)[0],
    ).toBeInTheDocument();
    expect(screen.getByTitle(/Test Box Preview/i)).toBeInTheDocument();
  });

  it("toggles fullscreen mode", () => {
    render(
      <MemoryRouter>
        <BoxWorkspace sandbox={sandbox as any} onClose={onClose} />
      </MemoryRouter>,
    );

    const chatInput = screen.getAllByPlaceholderText(/Ask your agent.../i)[0];
    expect(chatInput).toBeInTheDocument();

    const fullscreenButton = screen
      .getAllByRole("button")
      .find((b) => b.querySelector(".lucide-maximize2"));
    if (!fullscreenButton) throw new Error("Fullscreen button not found");

    fireEvent.click(fullscreenButton);

    // Chat panel should be hidden in fullscreen (on desktop)
    expect(screen.queryAllByPlaceholderText(/Ask your agent.../i).length).toBe(
      1,
    ); // Only mobile one remains?
  });

  it("calls onClose when back button is clicked", () => {
    render(
      <MemoryRouter>
        <BoxWorkspace sandbox={sandbox as any} onClose={onClose} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Back"));
    expect(onClose).toHaveBeenCalled();
  });
});
