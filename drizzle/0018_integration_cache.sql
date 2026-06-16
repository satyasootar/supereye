CREATE TABLE IF NOT EXISTS "integration_cache" (
  "user_id" text NOT NULL,
  "cache_key" text NOT NULL,
  "payload" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_integration_cache_user_key" UNIQUE("user_id","cache_key")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_cache" ADD CONSTRAINT "integration_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_integration_cache_user_id" ON "integration_cache" USING btree ("user_id");
