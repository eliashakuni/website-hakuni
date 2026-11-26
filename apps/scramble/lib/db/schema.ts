import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { LANGUAGES } from "../languages";

export const languageEnum = pgEnum("language", LANGUAGES);
export const planeStatusEnum = pgEnum("plane_status", ["ready", "used"]);

export const planes = pgTable(
  "planes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: languageEnum("language").notNull(),
    plane: jsonb("plane").$type<string[][]>().notNull(),
    wordList: jsonb("word_list").$type<string[]>().notNull(),
    // Word -> dictionary slug for the words in word_list that need one;
    // null for languages without dictionary slugs.
    slugs: jsonb("slugs").$type<Record<string, string>>(),
    tries: integer("tries").notNull(),
    points: integer("points").notNull(),
    status: planeStatusEnum("status").notNull().default("ready"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Set when the plane is handed out; a stale value means regeneration failed.
    updateStartedAt: timestamp("update_started_at", { withTimezone: true }),
  },
  (table) => [index("planes_language_status_idx").on(table.language, table.status)],
);
