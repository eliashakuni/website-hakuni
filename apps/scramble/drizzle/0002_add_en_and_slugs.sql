ALTER TYPE "public"."language" ADD VALUE 'en';--> statement-breakpoint
ALTER TABLE "planes" ADD COLUMN "slug_list" jsonb;