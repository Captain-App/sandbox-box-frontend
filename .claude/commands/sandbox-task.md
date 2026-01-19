---
description: Run a coding task in a Shipbox sandbox using the OpenCode agent
argument-hint: <task description> [--session <id>] [--repo <url>]
---

# Sandbox Task

Execute a coding task in a Shipbox sandbox using the OpenCode MCP server.

## Instructions

1. Use the `opencode_run_task` MCP tool to execute the task
2. The task argument is: $ARGUMENTS
3. If a sessionId was provided (--session), continue that session
4. If a repository URL was provided (--repo), clone it first

## Parameters to Extract

Parse the arguments to extract:
- **task**: The main task description (everything except flags)
- **sessionId**: Optional, if `--session <id>` is provided
- **repository**: Optional, if `--repo <url>` is provided

## After Submitting

1. Share the `webUiUrl` with the user so they can watch progress
2. Tell the user the `runId` for checking status later
3. Suggest using `/sandbox-status <runId>` to check when complete

## Example Usage

```
/sandbox-task Create a hello.txt file with "Hello World"
/sandbox-task --session abc12345 Add a README.md file
/sandbox-task --repo https://github.com/user/repo Fix the typo in index.js
```
