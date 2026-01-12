-- Add stripe_customer_id to user_balances
ALTER TABLE user_balances ADD COLUMN stripe_customer_id TEXT;

-- Create an index for faster lookup
CREATE INDEX IF NOT EXISTS idx_user_balances_stripe_customer ON user_balances(stripe_customer_id);
