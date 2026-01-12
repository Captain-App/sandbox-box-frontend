import { Command } from 'commander';
import { ShipboxApi } from '../api.js';
import chalk from 'chalk';
import Table from 'cli-table3';

export const listCommand = new Command('list')
  .description('List recent task runs')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      const api = new ShipboxApi();
      const sessions = await api.listSessions();

      if (options.json) {
        console.log(JSON.stringify(sessions, null, 2));
        return;
      }

      if (sessions.length === 0) {
        console.log(chalk.yellow('No sessions found.'));
        return;
      }

      const table = new Table({
        head: [
          chalk.bold('ID'),
          chalk.bold('Status'),
          chalk.bold('Task'),
          chalk.bold('Created'),
        ],
        colWidths: [25, 12, 40, 20],
      });

      sessions.forEach((s) => {
        const date = new Date(s.createdAt * 1000).toLocaleString();
        table.push([
          s.id,
          s.status === 'completed' ? chalk.green(s.status) : (s.status === 'failed' ? chalk.red(s.status) : chalk.yellow(s.status)),
          s.task || 'N/A',
          date,
        ]);
      });

      console.log(table.toString());
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });
