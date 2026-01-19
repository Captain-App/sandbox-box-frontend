import {
  Scenario,
  Precondition,
  TestStep,
  TestCategory,
  ScenarioState,
} from "../framework";

export const onboardingScenarios: Scenario[] = [
  {
    name: "New user can view dashboard after login",
    categories: [TestCategory.Onboarding, TestCategory.Critical, TestCategory.Smoke],
    preconditions: [],
    steps: [
      TestStep.Login,
      TestStep.NavigateToDashboard,
      TestStep.VerifyLoggedIn,
    ],
  },

  {
    name: "User can navigate to all main sections",
    categories: [TestCategory.Onboarding, TestCategory.Smoke],
    preconditions: [Precondition.LoggedIn],
    steps: [
      TestStep.NavigateToDashboard,
      TestStep.NavigateToBoxes,
      TestStep.NavigateToSettings,
      TestStep.NavigateToBilling,
    ],
  },

  {
    name: "User can create and manage API key in settings",
    categories: [TestCategory.Onboarding, TestCategory.Settings],
    preconditions: [Precondition.LoggedIn],
    steps: [
      TestStep.NavigateToSettings,
      TestStep.SetApiKey,
    ],
    stepParams: {
      1: { apiKey: "test-api-key-onboarding" },
    },
    verify: async (state: ScenarioState) => {
      if (!state.apiKeySet) {
        throw new Error("API key should be set after settings step");
      }
    },
  },

  {
    name: "User can view billing and balance",
    categories: [TestCategory.Onboarding, TestCategory.Billing, TestCategory.Smoke],
    preconditions: [Precondition.LoggedIn],
    steps: [
      TestStep.NavigateToBilling,
      TestStep.VerifyBalance,
    ],
    verify: async (state: ScenarioState) => {
      if (state.balance < 0) {
        throw new Error("Balance should not be negative");
      }
    },
  },
];
