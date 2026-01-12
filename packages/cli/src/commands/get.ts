import { Command } from "commander";
import { ShipboxApi } from "../api.js";
import chalk from "chalk";

export const getCommand = new Command("get")
  .description("Get status and results of a task run")
  .argument("<runId>", "The ID of the run to fetch")
  .option("--json", "Output in JSON format")
  .action(async (runId, options) => {
    try {
      const api = new ShipboxApi();
      const session = await api.getSession(runId);

      if (options.json) {
        console.log(JSON.stringify(session, null, 2));
        return;
      }

      console.log(`${chalk.bold("Run ID:")} ${session.id}`);
      console.log(
        `${chalk.bold("Status:")} ${session.status === "completed" ? chalk.green(session.status) : session.status === "failed" ? chalk.red(session.status) : chalk.yellow(session.status)}`,
      );
      console.log(`${chalk.bold("Task:")} ${session.task || "N/A"}`);
      console.log(
        `${chalk.bold("Created:")} ${new Date(session.createdAt * 1000).toLocaleString()}`,
      );

      if (session.repository) {
        console.log(`${chalk.bold("Repository:")} ${session.repository}`);
        if (session.branch) {
          console.log(`${chalk.bold("Branch:")} ${session.branch}`);
        }
      }

      console.log(
        `\nView full details: ${chalk.cyan(`https://shipbox.dev/sessions/${session.id}`)}`,
      );
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });
