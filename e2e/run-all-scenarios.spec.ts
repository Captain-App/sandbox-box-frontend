import { test, expect } from "@playwright/test";
import { scenarioTest, StepExecutor } from "./framework";
import { createExecutor } from "./steps";
import {
  allScenarios,
  printScenarioStats,
} from "./scenarios";

/**
 * Global scenario test runner
 * Executes all defined scenarios with full lifecycle support
 */

// Create executor once for all tests
const executor = createExecutor();

// Print stats at startup
printScenarioStats();

// Run each scenario
for (const scenario of allScenarios) {
  scenarioTest(test, executor, scenario);
}
