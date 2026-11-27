import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { BOARD_SIZES } from "../boardSizes";
import { GAME_MODES } from "../gameModes";
import { LANGUAGES } from "../languages";

export const languageEnum = pgEnum("language", LANGUAGES);
export const boardSizeEnum = pgEnum("board_size", BOARD_SIZES);
export const gameModeEnum = pgEnum("game_mode", GAME_MODES);
export const planeStatusEnum = pgEnum("plane_status", ["ready", "used"]);

export const planes = pgTable(
  "planes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: languageEnum("language").notNull(),
    boardSize: boardSizeEnum("board_size").notNull().default("standard"),
    gameMode: gameModeEnum("game_mode").notNull().default("standard"),
    plane: jsonb("plane").$type<string[][]>().notNull(),
    wordList: jsonb("word_list").$type<string[]>().notNull(),
    // Word -> dictionary slug for the words in word_list that need one;
    // null for languages without dictionary slugs.
    slugs: jsonb("slugs").$type<Record<string, string>>(),
    tries: integer("tries").notNull(),
    // bigint: a long-word board can be worth up to 2^36 points, past integer's 2^31.
    // Still exact as a JavaScript number (up to 2^53).
    points: bigint("points", { mode: "number" }).notNull(),
    // Long-word mode only: the long word hidden on the board.
    longWord: text("long_word"),
    status: planeStatusEnum("status").notNull().default("ready"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Set when the plane is handed out; a stale value means regeneration failed.
    updateStartedAt: timestamp("update_started_at", { withTimezone: true }),
  },
  (table) => [
    index("planes_language_size_mode_status_idx").on(
      table.language,
      table.boardSize,
      table.gameMode,
      table.status,
    ),
  ],
);
