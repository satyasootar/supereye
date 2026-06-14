CREATE TABLE IF NOT EXISTS "ai_usage_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "feature" text NOT NULL,
  "model" text,
  "input_tokens" integer DEFAULT 0 NOT NULL,
  "output_tokens" integer DEFAULT 0 NOT NULL,
  "total_tokens" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_ai_usage_user_id" ON "ai_usage_events" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_usage_feature" ON "ai_usage_events" ("user_id", "feature");
CREATE INDEX IF NOT EXISTS "idx_ai_usage_created_at" ON "ai_usage_events" ("created_at");
