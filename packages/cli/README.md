# Shipbox CLI

The official command-line interface for [shipbox.dev](https://shipbox.dev).

Delegate complex, long-running coding tasks to AI sandboxes directly from your terminal.

## Installation

```bash
npm install -g shipbox
```

## Setup

First, you'll need an API key from your [shipbox.dev settings](https://shipbox.dev/settings).

```bash
shipbox config set api-key YOUR_API_KEY
```

Alternatively, you can set the `SHIPBOX_API_KEY` environment variable.

## Usage

### Start a task

```bash
shipbox run "Implement a new feature X and add tests" --repo https://github.com/user/repo
```

Options:
- `-r, --repo <url>`: Git repository URL to clone
- `-b, --branch <name>`: Branch to checkout
- `-s, --session <id>`: Continue an existing session

### List recent runs

```bash
shipbox list
```

### Get run details

```bash
shipbox get <runId>
```

### Configuration

```bash
shipbox config set base-url https://backend.shipbox.dev
shipbox config get api-key
shipbox config delete api-key
```

## License

MIT
