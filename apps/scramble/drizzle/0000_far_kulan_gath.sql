CREATE TYPE "public"."language" AS ENUM('fi', 'se');--> statement-breakpoint
CREATE TYPE "public"."plane_status" AS ENUM('ready', 'used');--> statement-breakpoint
CREATE TABLE "planes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" "language" NOT NULL,
	"plane" jsonb NOT NULL,
	"word_list" jsonb NOT NULL,
	"tries" integer NOT NULL,
	"points" integer NOT NULL,
	"status" "plane_status" DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_started_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "planes_language_status_idx" ON "planes" USING btree ("language","status");