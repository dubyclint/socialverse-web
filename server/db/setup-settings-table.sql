-- Create the settings table for socialverse-web
CREATE TABLE IF NOT EXISTS settings (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  PRIMARY KEY (scope, key)
);
