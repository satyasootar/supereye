ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "bot_settings" jsonb DEFAULT '{"showTips":true,"autoCloseTips":false,"autoCloseDelay":5000}'::jsonb NOT NULL;
