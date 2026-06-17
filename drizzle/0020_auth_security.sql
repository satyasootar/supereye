ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_changed_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "login_attempts" (
  "id" text PRIMARY KEY NOT NULL,
  "ip_hash" text NOT NULL,
  "email_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "login_attempts_ip_hash_created_at_idx" ON "login_attempts" ("ip_hash", "created_at");
CREATE INDEX IF NOT EXISTS "login_attempts_email_hash_created_at_idx" ON "login_attempts" ("email_hash", "created_at");
