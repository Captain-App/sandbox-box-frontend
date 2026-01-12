-- Shipbox API Keys for CLI/API access
CREATE TABLE IF NOT EXISTS user_shipbox_api_keys (
  key_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hint TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_used INTEGER
);

CREATE INDEX IF NOT EXISTS idx_shipbox_api_keys_user ON user_shipbox_api_keys(user_id);
