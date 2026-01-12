import { Command } from "commander";
import { configStore } from "../config.js";
import chalk from "chalk";

export const configCommand = new Command("config").description(
  "Manage CLI configuration",
);

configCommand
  .command("set <key> <value>")
  .description("Set a configuration value")
  .action((key, value) => {
    if (key !== "api-key" && key !== "base-url") {
      console.error(
        chalk.red(
          `Error: Unknown configuration key "${key}". Valid keys: api-key, base-url`,
        ),
      );
      process.exit(1);
    }

    const configKey = key === "api-key" ? "apiKey" : "baseUrl";
    configStore.set(configKey, value);
    console.log(chalk.green(`Successfully set ${key}`));
  });

configCommand
  .command("get [key]")
  .description("Get configuration value(s)")
  .action((key) => {
    if (key) {
      if (key !== "api-key" && key !== "base-url") {
        console.error(
          chalk.red(
            `Error: Unknown configuration key "${key}". Valid keys: api-key, base-url`,
          ),
        );
        process.exit(1);
      }
      const configKey = key === "api-key" ? "apiKey" : "baseUrl";
      console.log(configStore.get(configKey));
    } else {
      console.log(JSON.stringify(configStore.store, null, 2));
    }
  });

configCommand
  .command("delete <key>")
  .description("Delete a configuration value")
  .action((key) => {
    if (key !== "api-key" && key !== "base-url") {
      console.error(
        chalk.red(
          `Error: Unknown configuration key "${key}". Valid keys: api-key, base-url`,
        ),
      );
      process.exit(1);
    }
    const configKey = key === "api-key" ? "apiKey" : "baseUrl";
    configStore.delete(configKey);
    console.log(chalk.green(`Successfully deleted ${key}`));
  });
