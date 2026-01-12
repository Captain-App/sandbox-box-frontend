import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Settings } from "./Settings";
import { api } from "../lib/api";
import { settingsFactory, githubStatusFactory } from "../test-utils";

// Use hoisted to define the mock before vi.mock is called
const { __createMockApi } = vi.hoisted(() => ({
  __createMockApi: () => ({
    getSessions: vi.fn().mockResolvedValue([]),
    createSession: vi.fn(),
    getSession: vi.fn(),
    deleteSession: vi.fn(),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    reportUsage: vi.fn(),
    getSettings: vi.fn().mockResolvedValue({ anthropicHint: null }),
    setAnthropicKey: vi.fn(),
    deleteAnthropicKey: vi.fn(),
    getGitHubStatus: vi.fn().mockResolvedValue(null),
    disconnectGitHub: vi.fn(),
    getBalance: vi.fn().mockResolvedValue({ balanceCredits: 0 }),
    createCheckoutSession: vi.fn(),
    getBoxSecrets: vi.fn().mockResolvedValue([]),
    createBoxSecret: vi.fn(),
    deleteBoxSecret: vi.fn(),
  }),
}));

vi.mock("../lib/api", () => ({
  api: __createMockApi(),
}));

const mockedApi = vi.mocked(api);

describe("Settings Component", () => {
  it("renders loading state initially", async () => {
    mockedApi.getSettings.mockReturnValue(new Promise(() => {}));
    mockedApi.getGitHubStatus.mockReturnValue(new Promise(() => {}));

    render(<Settings />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders settings and github status when loaded", async () => {
    mockedApi.getSettings.mockResolvedValue(
      settingsFactory({ anthropicHint: "***1234" }),
    );
    mockedApi.getGitHubStatus.mockResolvedValue(
      githubStatusFactory({ accountLogin: "crew", accountType: "User" }),
    );

    render(<Settings />);

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );

    expect(screen.getByText(/Custom key active/i)).toBeInTheDocument();
    expect(screen.getByText(/\*\*\*1234/)).toBeInTheDocument();
    expect(screen.getByText(/crew/)).toBeInTheDocument();
  });

  it('shows "Connect GitHub" when not connected', async () => {
    mockedApi.getSettings.mockResolvedValue(
      settingsFactory({ anthropicHint: null }),
    );
    mockedApi.getGitHubStatus.mockResolvedValue(null);

    render(<Settings />);

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );

    expect(screen.getByText(/Connect GitHub App/i)).toBeInTheDocument();
  });

  it("handles API key updates", async () => {
    mockedApi.getSettings.mockResolvedValue(
      settingsFactory({ anthropicHint: null }),
    );
    mockedApi.getGitHubStatus.mockResolvedValue(null);
    mockedApi.setAnthropicKey.mockResolvedValue(undefined);

    render(<Settings />);

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );

    // Fix: Use more specific selector to avoid matching the button
    const input = screen.getByPlaceholderText(/Paste sk-ant-... key/i);
    fireEvent.change(input, { target: { value: "sk-ant-newkey" } });

    // Fix: Use text content for the button
    const saveButton = screen.getByText(/Save Key/i);
    fireEvent.click(saveButton);

    expect(mockedApi.setAnthropicKey).toHaveBeenCalledWith("sk-ant-newkey");
  });
});
