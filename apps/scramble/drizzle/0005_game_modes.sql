CREATE TYPE "public"."game_mode" AS ENUM('standard', 'longWord');--> statement-breakpoint
DROP INDEX "planes_language_size_status_idx";--> statement-breakpoint
ALTER TABLE "planes" ALTER COLUMN "points" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "planes" ADD COLUMN "game_mode" "game_mode" DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "planes" ADD COLUMN "long_word" text;--> statement-breakpoint
CREATE INDEX "planes_language_size_mode_status_idx" ON "planes" USING btree ("language","board_size","game_mode","status");