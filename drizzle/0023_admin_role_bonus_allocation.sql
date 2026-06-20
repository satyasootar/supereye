-- Add bonus_allocation to token wallets (admin-granted extra tokens per period)
ALTER TABLE "token_wallets" ADD COLUMN IF NOT EXISTS "bonus_allocation" bigint DEFAULT 0 NOT NULL;
