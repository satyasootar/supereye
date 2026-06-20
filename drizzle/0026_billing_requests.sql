CREATE TABLE IF NOT EXISTS "billing_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "pack_id" uuid REFERENCES "token_top_up_packs"("id") ON DELETE SET NULL,
  "plan_id" uuid REFERENCES "plans"("id") ON DELETE SET NULL,
  "current_plan_id" uuid REFERENCES "plans"("id") ON DELETE SET NULL,
  "user_note" text,
  "admin_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "admin_note" text,
  "processed_at" timestamp with time zone,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_billing_requests_user" ON "billing_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_billing_requests_status" ON "billing_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_billing_requests_created" ON "billing_requests" ("created_at");
