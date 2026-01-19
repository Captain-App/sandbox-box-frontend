import { Page } from "@playwright/test";
import { ScenarioState, StepParams, TestStep, stepDisplayNames } from "./scenario";

/**
 * Context passed to step implementations
 */
export interface StepContext {
  page: Page;
  state: ScenarioState;
  settle: (timeout?: number) => Promise<void>;
  goto: (url: string) => Promise<void>;
  getUrl: () => string;
}

/**
 * Step implementation function signature
 */
export type StepImplementation = (
  ctx: StepContext,
  params?: StepParams,
) => Promise<void>;

/**
 * Executor that dispatches steps to domain-specific implementations
 */
export class StepExecutor {
  private steps: Map<TestStep, StepImplementation> = new Map();

  register(step: TestStep, implementation: StepImplementation): void {
    this.steps.set(step, implementation);
  }

  registerModule(
    module: Record<TestStep, StepImplementation | undefined>,
  ): void {
    for (const [key, impl] of Object.entries(module)) {
      const step = Object.values(TestStep).find(
        (s) => stepDisplayNames[s] === stepDisplayNames[key as TestStep],
      );
      if (step && impl) {
        this.register(step, impl);
      }
    }
  }

  async execute(
    ctx: StepContext,
    step: TestStep,
    params?: StepParams,
  ): Promise<void> {
    const impl = this.steps.get(step);
    if (!impl) {
      throw new Error(`No implementation registered for step: ${step}`);
    }

    console.log(`📍 Executing: ${stepDisplayNames[step]}`);
    try {
      await impl(ctx, params);
      console.log(`✅ Completed: ${stepDisplayNames[step]}`);
    } catch (error) {
      console.log(`❌ Failed: ${stepDisplayNames[step]}`);
      throw error;
    }
  }
}
