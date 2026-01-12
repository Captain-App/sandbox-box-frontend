---
title: API Endpoints
description: Detailed reference for all Shipbox API endpoints.
---

Detailed reference for the Shipbox REST API.

## Sessions

### List Sessions
`GET /sessions`
Returns a list of all sandboxes.

### Create Session
`POST /sessions`
Creates a new sandbox.
- `name`: string
- `region`: string
- `repository`: string (optional)

### Get Session
`GET /sessions/{id}`
Returns details for a specific sandbox.

### Delete Session
`DELETE /sessions/{id}`
Permanently deletes a sandbox.

## Billing

### Get Balance
`GET /billing/balance`
Returns the current credit balance.

### Create Checkout Session
`POST /billing/checkout`
Initiates a Stripe checkout flow.
- `amountCredits`: number

### List Transactions
`GET /billing/transactions`
Returns a list of recent transactions.
- `limit`: number (optional, default 50)

### Get Monthly Consumption
`GET /billing/consumption`
Returns total credits spent in the last 30 days.

## Box Secrets

### List Secrets
`GET /box-secrets`
Returns a list of encrypted secrets (names and hints only).

### Create Secret
`POST /box-secrets`
Creates a new encrypted secret.
- `name`: string
- `value`: string

### Delete Secret
`DELETE /box-secrets/{id}`
Deletes a secret.

## GitHub

### Get Status
`GET /github/status`
Returns connection status for the GitHub App.

### Link Installation
`POST /github/link`
Links a GitHub App installation to the user account.
