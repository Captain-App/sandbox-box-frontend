---
description: Check the status of a Shipbox sandbox task run
argument-hint: <runId>
---

# Sandbox Status

Check the status and result of a Shipbox sandbox task run.

## Instructions

1. Use the `opencode_get_result` MCP tool with runId: $ARGUMENTS
2. Report the status: started, running, completed, or failed
3. If completed, show the result summary
4. If still running, suggest checking again later

## Status Values

- **started**: Task just queued, waiting to start
- **running**: Agent is actively working
- **completed**: Task finished successfully
- **failed**: Task encountered an error

## Output Format

Report:
- Status
- Task title
- Started time
- Completed time (if done)
- Result summary (if completed)
- Web UI URL for detailed view

## Example Usage

```
/sandbox-status run-abc12345
```
