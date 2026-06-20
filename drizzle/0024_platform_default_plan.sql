-- Default plan assigned to new users on first sign-in
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "default_signup_plan_id" uuid REFERENCES "plans"("id") ON DELETE SET NULL;
