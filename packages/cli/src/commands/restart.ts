import { Command } from "commander";
import { ShipboxApi } from "../api.js";
import chalk from "chalk";

export const restartCommand = new Command("restart")
  .description("Restart a sandbox session (wake it up or reset its state)")
  .argument("<sessionId>", "The session ID to restart (e.g., 7db013fe)")
  .option("--force", "Force restart even if session appears active")
  .action(async (sessionId, options) => {
    try {
      const api = new ShipboxApi();

      console.log(chalk.cyan(`Restarting sandbox ${sessionId}...`));

      // First, get the session to verify it exists
      const session = await api.getSession(sessionId);

      if (!options.force && session.status === "running") {
        console.log(chalk.yellow(`Session ${sessionId} is already running.`));
        console.log(chalk.dim("Use --force to restart anyway."));
        return;
      }

      // Restart the session (this wakes up the sandbox)
      const result = await api.restartSession(sessionId);

      if (result.success) {
        console.log(chalk.green(`✓ Sandbox ${sessionId} restarted successfully!`));
        console.log(`${chalk.bold("Status:")} ${result.status}`);
        console.log(
          `\nView in browser: ${chalk.cyan(`https://shipbox.dev/boxes/${sessionId}`)}`,
        );
      } else {
        console.error(chalk.red("Failed to restart sandbox."));
        process.exit(1);
      }
    } catch (error: any) {
      if (error.message.includes("404") || error.message.includes("Not found")) {
        console.error(chalk.red(`Error: Session ${sessionId} not found.`));
        console.log(chalk.dim("Use 'shipbox list' to see your active sessions."));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
