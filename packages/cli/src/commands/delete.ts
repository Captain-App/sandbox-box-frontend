import { Command } from "commander";
import { ShipboxApi } from "../api.js";
import chalk from "chalk";

export const deleteCommand = new Command("delete")
  .description("Delete a sandbox session")
  .argument("<sessionId>", "The session ID to delete (e.g., 7db013fe)")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (sessionId, options) => {
    try {
      const api = new ShipboxApi();

      if (!options.yes) {
        console.log(chalk.yellow(`Warning: This will permanently delete sandbox ${sessionId}.`));
        console.log(chalk.dim("Use -y or --yes to skip this confirmation."));

        // Simple confirmation using readline
        const readline = await import("readline");
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question("Are you sure? (y/N) ", resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
          console.log(chalk.dim("Cancelled."));
          return;
        }
      }

      console.log(chalk.cyan(`Deleting sandbox ${sessionId}...`));

      const result = await api.deleteSession(sessionId);

      if (result.success) {
        console.log(chalk.green(`✓ Sandbox ${sessionId} deleted successfully!`));
      } else {
        console.error(chalk.red("Failed to delete sandbox."));
        process.exit(1);
      }
    } catch (error: any) {
      if (error.message.includes("404") || error.message.includes("Not found")) {
        console.error(chalk.red(`Error: Session ${sessionId} not found.`));
      } else if (error.message.includes("403")) {
        console.error(chalk.red(`Error: You don't have permission to delete this session.`));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
