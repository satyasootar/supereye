-- User keyboard shortcut overrides (per binding id)
CREATE TABLE IF NOT EXISTS "user_keybindings" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
