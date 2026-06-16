ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "insight_category" text;
ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "insight_summary" text;
ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "extracted_links" jsonb;
ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "extracted_otps" jsonb;
ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "insight_classified_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "daily_briefs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "brief_date" text NOT NULL,
  "narrative" text,
  "snapshot" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_daily_briefs_user_date" ON "daily_briefs" ("user_id", "brief_date");
CREATE INDEX IF NOT EXISTS "idx_daily_briefs_user_id" ON "daily_briefs" ("user_id");
