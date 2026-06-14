ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "priority_tier" text;
ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "priority_score" integer;
ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "priority_reason" text;
ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "priority_classified_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "idx_emails_priority_tier" ON "emails" ("user_id", "priority_tier");
