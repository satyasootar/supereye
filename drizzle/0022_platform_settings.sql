CREATE TABLE IF NOT EXISTS "platform_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"demo_login_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "platform_settings" ("id", "demo_login_enabled")
VALUES ('default', true)
ON CONFLICT ("id") DO NOTHING;
