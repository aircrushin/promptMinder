CREATE TABLE evaluation_suites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_by text NOT NULL,
  name text NOT NULL,
  cases jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evaluation_suites_scope_idx ON evaluation_suites(team_id, created_by);
CREATE TABLE evaluation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_by text NOT NULL,
  change_request_id uuid REFERENCES prompt_change_requests(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'running',
  data jsonb NOT NULL,
  reviews jsonb NOT NULL DEFAULT '{}',
  revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evaluation_reports_scope_idx ON evaluation_reports(team_id, created_by);
CREATE INDEX evaluation_reports_request_idx ON evaluation_reports(change_request_id);
