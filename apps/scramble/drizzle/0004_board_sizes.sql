CREATE TYPE "public"."board_size" AS ENUM('standard', 'large', 'huge');--> statement-breakpoint
DROP INDEX "planes_language_status_idx";--> statement-breakpoint
ALTER TABLE "planes" ADD COLUMN "board_size" "board_size" DEFAULT 'standard' NOT NULL;--> statement-breakpoint
CREATE INDEX "planes_language_size_status_idx" ON "planes" USING btree ("language","board_size","status");