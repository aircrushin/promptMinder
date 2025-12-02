-- Provider API keys stored per user
CREATE TABLE IF NOT EXISTS provider_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  provider text NOT NULL,
  api_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_keys_user_provider_idx
  ON provider_keys (user_id, provider);

CREATE INDEX IF NOT EXISTS provider_keys_user_idx
  ON provider_keys (user_id);

-- Automatically update the updated_at column
CREATE OR REPLACE FUNCTION provider_keys_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS provider_keys_set_updated_at_trigger ON provider_keys;
CREATE TRIGGER provider_keys_set_updated_at_trigger
BEFORE UPDATE ON provider_keys
FOR EACH ROW
EXECUTE FUNCTION provider_keys_set_updated_at();

