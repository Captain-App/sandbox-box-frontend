import { Command } from "commander";
import { ShipboxApi } from "../api.js";
import chalk from "chalk";

export const runCommand = new Command("run")
  .description("Start a new coding task in a sandbox")
  .argument("<task>", "Description of the task to perform")
  .option("-r, --repo <url>", "Git repository URL to clone")
  .option("-b, --branch <name>", "Branch to checkout")
  .option("-s, --session <id>", "Continue an existing session")
  .action(async (task, options) => {
    try {
      const api = new ShipboxApi();
      console.log(chalk.blue("Starting task..."));

      const session = await api.createSession({
        task,
        repository: options.repo,
        branch: options.branch,
        sessionId: options.session,
      });

      console.log(chalk.green("Task started successfully!"));
      console.log(`${chalk.bold("Run ID:")} ${session.id}`);
      console.log(`${chalk.bold("Status:")} ${session.status}`);
      console.log(
        `\nView progress: ${chalk.cyan(`https://shipbox.dev/sessions/${session.id}`)}`,
      );
      console.log(`Check status: ${chalk.cyan(`shipbox get ${session.id}`)}`);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });
