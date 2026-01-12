import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingDashboard } from "./BillingDashboard";
import { api } from "../lib/api";
import { balanceFactory } from "../test-utils";

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
    getTransactions: vi.fn().mockResolvedValue([]),
    getConsumption: vi.fn().mockResolvedValue({ consumptionCredits: 0 }),
  }),
}));

vi.mock("../lib/api", () => ({
  api: __createMockApi(),
}));

const mockedApi = vi.mocked(api);

describe("BillingDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getBalance.mockResolvedValue(
      balanceFactory({ balanceCredits: 0 }),
    );
    mockedApi.getTransactions.mockResolvedValue([]);
    mockedApi.getConsumption.mockResolvedValue({ consumptionCredits: 0 });
  });

  it("renders loading state initially", async () => {
    mockedApi.getBalance.mockReturnValue(new Promise(() => {}));

    render(<BillingDashboard />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  it("renders billing data when loaded", async () => {
    mockedApi.getBalance.mockResolvedValue(
      balanceFactory({ balanceCredits: 2500 }),
    );
    mockedApi.getTransactions.mockResolvedValue([
      {
        id: "1",
        amountCredits: -500,
        type: "usage",
        description: "Compute usage",
        createdAt: Date.now() / 1000,
      },
    ]);
    mockedApi.getConsumption.mockResolvedValue({ consumptionCredits: 1200 });

    render(<BillingDashboard />);

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );

    expect(screen.getByText(/£25.00/)).toBeInTheDocument(); // Balance
    expect(screen.getByText(/£12.00/)).toBeInTheDocument(); // Consumption
    expect(screen.getAllByText("Compute usage")[0]).toBeInTheDocument(); // Transaction
    expect(screen.getAllByText(/£-5.00/)[0]).toBeInTheDocument(); // Transaction amount
  });

  it("handles top-up button click", async () => {
    mockedApi.createCheckoutSession.mockResolvedValue({
      url: "https://stripe.com/pay",
    });

    render(<BillingDashboard />);

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );

    const topUpButton = screen.getByText(/Top Up £10.00/i);
    fireEvent.click(topUpButton);

    await waitFor(() => {
      expect(mockedApi.createCheckoutSession).toHaveBeenCalledWith(1000);
    });
  });
});
