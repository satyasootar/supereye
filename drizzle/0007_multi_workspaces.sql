CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Workspace' NOT NULL,
	"primary_plugin_id" text NOT NULL,
	"sidebar_plugin_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "user_preferences" ADD COLUMN "active_workspace_id" uuid;

INSERT INTO "workspaces" ("user_id", "name", "primary_plugin_id", "sidebar_plugin_id", "sort_order")
SELECT
	"user_id",
	'Default',
	COALESCE("primary_plugin_id", 'email'),
	"sidebar_plugin_id",
	0
FROM "user_preferences"
WHERE "primary_plugin_id" IS NOT NULL;

UPDATE "user_preferences" up
SET "active_workspace_id" = w."id"
FROM "workspaces" w
WHERE w."user_id" = up."user_id" AND w."sort_order" = 0 AND up."active_workspace_id" IS NULL;

ALTER TABLE "user_preferences" DROP COLUMN IF EXISTS "primary_plugin_id";
ALTER TABLE "user_preferences" DROP COLUMN IF EXISTS "sidebar_plugin_id";

ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "idx_workspaces_user_id" ON "workspaces" USING btree ("user_id");
