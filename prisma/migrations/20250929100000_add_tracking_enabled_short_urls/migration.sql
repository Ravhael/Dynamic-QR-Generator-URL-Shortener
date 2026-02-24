-- Add tracking_enabled column to short_urls if not exists
ALTER TABLE "public"."short_urls" ADD COLUMN IF NOT EXISTS "tracking_enabled" BOOLEAN DEFAULT true;
-- Backfill nulls to true
UPDATE "public"."short_urls" SET tracking_enabled = true WHERE tracking_enabled IS NULL;
