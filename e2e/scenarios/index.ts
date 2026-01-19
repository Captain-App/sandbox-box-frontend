import { Scenario } from "../framework";
import { authScenarios } from "./auth-scenarios";
import { boxScenarios } from "./box-scenarios";
import { onboardingScenarios } from "./onboarding-scenarios";

/**
 * All scenario definitions combined
 * Import specific scenario lists for targeted testing
 */
export const allScenarios: Scenario[] = [
  ...authScenarios,
  ...boxScenarios,
  ...onboardingScenarios,
];

/**
 * Helper function to get scenarios by category
 */
export function scenariosByCategory(
  category: string,
): Scenario[] {
  return allScenarios.filter((s) =>
    s.categories.some((c) => c === category),
  );
}

/**
 * Print scenario statistics
 */
export function printScenarioStats(): void {
  console.log("\n📊 Scenario Statistics:");
  console.log(`   Total scenarios: ${allScenarios.length}`);
  console.log(`   Auth scenarios: ${authScenarios.length}`);
  console.log(`   Box scenarios: ${boxScenarios.length}`);
  console.log(`   Onboarding scenarios: ${onboardingScenarios.length}\n`);
}

// Re-export for convenience
export { authScenarios, boxScenarios, onboardingScenarios };
