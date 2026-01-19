import {
  Scenario,
  Precondition,
  TestStep,
  TestCategory,
  ScenarioState,
} from "../framework";

export const authScenarios: Scenario[] = [
  {
    name: "User can login and see dashboard",
    categories: [TestCategory.Auth, TestCategory.Critical, TestCategory.Smoke],
    preconditions: [],
    steps: [TestStep.Login, TestStep.VerifyLoggedIn],
    verify: async (state: ScenarioState) => {
      // Verify state was updated correctly
      if (!state.isLoggedIn) {
        throw new Error("User should be logged in after login step");
      }
      if (!state.currentUserEmail) {
        throw new Error("User email should be set after login step");
      }
    },
  },

  {
    name: "User can logout and return to login page",
    categories: [TestCategory.Auth, TestCategory.Critical],
    preconditions: [Precondition.LoggedIn],
    steps: [TestStep.Logout, TestStep.VerifyLoggedOut],
    verify: async (state: ScenarioState) => {
      if (state.isLoggedIn) {
        throw new Error("User should be logged out after logout step");
      }
    },
  },

  {
    name: "User can login again after logout",
    categories: [TestCategory.Auth, TestCategory.Critical],
    preconditions: [],
    steps: [
      TestStep.Login,
      TestStep.VerifyLoggedIn,
      TestStep.Logout,
      TestStep.VerifyLoggedOut,
      TestStep.Login,
      TestStep.VerifyLoggedIn,
    ],
  },

  {
    name: "Login page displays correctly",
    categories: [TestCategory.Auth, TestCategory.Smoke],
    preconditions: [],
    steps: [TestStep.NavigateToLogin],
  },
];
