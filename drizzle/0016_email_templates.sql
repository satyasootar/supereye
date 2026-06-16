CREATE TABLE IF NOT EXISTS "email_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "subject" text DEFAULT '' NOT NULL,
  "html_content" text NOT NULL,
  "is_predefined" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_email_templates_user_id" ON "email_templates" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_email_templates_created_at" ON "email_templates" ("created_at");
