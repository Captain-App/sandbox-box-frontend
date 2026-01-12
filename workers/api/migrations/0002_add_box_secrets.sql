-- Box Secrets: Encrypted secrets for sandboxes
CREATE TABLE IF NOT EXISTS user_box_secrets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,           -- e.g. "GITHUB_TOKEN"
  encrypted_value TEXT NOT NULL, -- AES-GCM encrypted
  hint TEXT NOT NULL,           -- Last 4 chars for display
  created_at INTEGER NOT NULL,
  last_used INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_box_secrets_user_name ON user_box_secrets(user_id, name);
CREATE INDEX IF NOT EXISTS idx_box_secrets_user ON user_box_secrets(user_id);
