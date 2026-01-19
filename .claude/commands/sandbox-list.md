---
description: List recent Shipbox sandbox task runs
argument-hint: [--session <id>] [--status <status>] [--limit <n>]
---

# Sandbox List

List recent task runs from Shipbox sandboxes.

## Instructions

1. Use the `opencode_list_runs` MCP tool
2. Parse optional filters from arguments:
   - `--session <id>`: Filter by session
   - `--status <status>`: Filter by status (started, running, completed, failed)
   - `--limit <n>`: Number of results (default 10)

## Output Format

Display as a table or list:
- Run ID
- Session ID
- Status
- Title
- Started time
- Completed time

Highlight any runs that are still in progress.

## Example Usage

```
/sandbox-list
/sandbox-list --limit 5
/sandbox-list --session abc12345
/sandbox-list --status completed
```
