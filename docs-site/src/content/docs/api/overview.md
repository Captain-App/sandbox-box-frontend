---
title: API Overview
description: Learn how to interact with the Shipbox API.
---

Shipbox provides a RESTful API for managing sandboxes and credits programmatically.

## Base URL

All API requests should be made to:

```text
https://api.shipbox.dev/v1
```

## Authentication

All requests require a Bearer token in the `Authorization` header.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.shipbox.dev/v1/sessions
```

You can find your token in the [Settings](/features/settings) panel or use the Supabase Auth library.

## Response Format

All responses are returned as JSON.

```json
{
  "id": "sb-123",
  "status": "active",
  "createdAt": "2026-01-11T23:00:00Z"
}
```
