import { Command } from 'commander';
import http from 'http';
import { exec } from 'child_process';
import chalk from 'chalk';
import { configStore } from '../config.js';

export const loginCommand = new Command('login')
  .description('Log in to shipbox.dev via browser')
  .action(async () => {
    const port = 49152 + Math.floor(Math.random() * 1000); // Random high port
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);
      const token = url.searchParams.get('token');

      if (token) {
        configStore.set('apiKey', token);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Login Successful</h1><p>You can close this window and return to the terminal.</p>');
        console.log(chalk.green('\nSuccessfully logged in!'));
        process.exit(0);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Login Failed</h1><p>No token found in request.</p>');
        process.exit(1);
      }
    });

    server.listen(port, () => {
      const loginUrl = `https://shipbox.dev/login?cli_port=${port}`;
      console.log(chalk.cyan('Opening your browser to log in...'));
      console.log(chalk.dim(`URL: ${loginUrl}`));

      const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${start} ${loginUrl}`, (err) => {
        if (err) {
          console.log(chalk.yellow(`\nFailed to open browser automatically. Please open this URL manually:\n${loginUrl}`));
        }
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      console.log(chalk.red('\nLogin timed out.'));
      process.exit(1);
    }, 5 * 60 * 1000);
  });
