import {
  Scenario,
  Precondition,
  TestStep,
  TestCategory,
  ScenarioState,
} from "../framework";

export const boxScenarios: Scenario[] = [
  {
    name: "User can create a new sandbox box",
    categories: [TestCategory.Box, TestCategory.Critical, TestCategory.Smoke],
    preconditions: [Precondition.LoggedIn],
    steps: [
      TestStep.NavigateToBoxes,
      TestStep.CreateBox,
    ],
    stepParams: {
      1: { title: "Test Sandbox Box" },
    },
    verify: async (state: ScenarioState) => {
      if (!state.currentSessionTitle) {
        throw new Error("Session title should be set after creating box");
      }
    },
  },

  {
    name: "User can open a sandbox box and view workspace",
    categories: [TestCategory.Box, TestCategory.Critical],
    preconditions: [Precondition.LoggedIn],
    steps: [
      TestStep.NavigateToBoxes,
      TestStep.CreateBox,
      TestStep.OpenBox,
      TestStep.VerifyAgentResponse,
    ],
    stepParams: {
      1: { title: "Workspace Test Box" },
    },
  },

  {
    name: "User can send a message in a sandbox box",
    categories: [TestCategory.Box, TestCategory.Smoke],
    preconditions: [Precondition.LoggedIn, Precondition.HasSession],
    steps: [
      TestStep.NavigateToBoxes,
      TestStep.OpenBox,
      TestStep.SendMessage,
    ],
    stepParams: {
      2: { message: "Hello, test message" },
    },
  },

  {
    name: "User can view sandbox box preview",
    categories: [TestCategory.Box],
    preconditions: [Precondition.LoggedIn, Precondition.HasSession],
    steps: [
      TestStep.NavigateToBoxes,
      TestStep.OpenBox,
      TestStep.OpenBoxPreview,
    ],
  },

  {
    name: "User can delete a sandbox box",
    categories: [TestCategory.Box],
    preconditions: [Precondition.LoggedIn, Precondition.HasSession],
    steps: [
      TestStep.NavigateToBoxes,
      TestStep.OpenBox,
      TestStep.DeleteBox,
    ],
  },
];
