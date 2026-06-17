ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_time_spent_seconds" integer DEFAULT 0 NOT NULL;

CREATE TABLE IF NOT EXISTS "user_login_events" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "method" text NOT NULL,
  "logged_in_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_activity_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ended_at" timestamp with time zone,
  "duration_seconds" integer
);

CREATE INDEX IF NOT EXISTS "user_login_events_user_id_logged_in_at_idx" ON "user_login_events" ("user_id", "logged_in_at" DESC);
CREATE INDEX IF NOT EXISTS "user_activity_sessions_user_id_started_at_idx" ON "user_activity_sessions" ("user_id", "started_at" DESC);
CREATE INDEX IF NOT EXISTS "user_activity_sessions_active_idx" ON "user_activity_sessions" ("user_id", "ended_at", "last_heartbeat_at");
