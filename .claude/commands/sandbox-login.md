---
description: Get authentication token for Shipbox sandbox MCP
---

# Sandbox Login

To use Shipbox sandbox commands, you need to set the `SUPABASE_ACCESS_TOKEN` environment variable.

## Option 1: From Browser (Quick)

1. Log in to https://shipbox.dev
2. Open browser DevTools (F12)
3. Go to Application > Local Storage > https://shipbox.dev
4. Find the key starting with `sb-` and ending with `-auth-token`
5. Copy the `access_token` value from the JSON

Then set it:
```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
```

## Option 2: Using CLI Script

Run this to authenticate and get a token:

```bash
npx tsx scripts/get-supabase-token.ts
```

This will prompt for email/password and output the access token.

## Verify Connection

After setting the token, the MCP server should connect automatically.
You can test with:
```
/sandbox-list
```

## Token Expiry

Tokens expire after 1 hour. If you get authentication errors, get a fresh token.
