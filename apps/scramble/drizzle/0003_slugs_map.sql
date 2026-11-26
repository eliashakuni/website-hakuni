-- Hand-written: slug_list (array parallel to word_list) becomes slugs (word -> slug map).
-- Old arrays don't fit the new shape, so they are cleared; links fall back to the word itself.
ALTER TABLE "planes" RENAME COLUMN "slug_list" TO "slugs";--> statement-breakpoint
UPDATE "planes" SET "slugs" = NULL;
