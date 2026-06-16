ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "keybindings_enabled" boolean DEFAULT true NOT NULL;
