-- Hand-written: the generated drop/recreate would fail on existing 'se' rows.
ALTER TYPE "public"."language" RENAME VALUE 'se' TO 'sv';
