# Project instructions

- Always ask if anything is unclear. Don't guess what's meant when a request is ambiguous.

# Repository overview

A pnpm monorepo (`pnpm@12`, workspace in `pnpm-workspace.yaml`) with these apps:

| Path | What it is |
|---|---|
| `apps/main-site` | hakuni.se, a static personal site in Swedish (`/`) and English (`/en/`). Vite, plain HTML/CSS/TS. Its `README.md` covers structure and deployment. |
| `apps/scramble` | Scramble, a timed word-finding game in Finnish, Swedish and English. Next.js 16 + React 19 + next-intl + Tailwind 4 + Drizzle/Postgres. |
| `apps/old-scramble` | The earlier Create React App + PHP version. **Kept for reference only**: excluded from the workspace, never installed, built or run. Don't edit it. |
| `local-files/` | Git-ignored scratch area: dictionary scrapers and word-list cleaners (see "Word data pipeline"). |

## Commands

Run from the repo root:

```bash
pnpm dev:site        # main-site dev server
pnpm build:site      # main-site: tsc + vite build -> apps/main-site/dist
pnpm dev:project     # scramble dev server (next dev)
pnpm build:project   # scramble production build
pnpm --filter scramble lint
pnpm --filter scramble db:generate   # drizzle-kit generate, after editing lib/db/schema.ts
pnpm --filter scramble db:migrate    # apply migrations (needs POSTGRES_URL_NON_POOLING)
```

There is no test suite. Check work with lint and a build.

## Scramble (`apps/scramble`)

**Read `apps/scramble/AGENTS.md` first.** This Next.js version differs from what you may know. Its docs are in `apps/scramble/node_modules/next/dist/docs/`. `next dev` rewrites that AGENTS.md block, which is expected. `apps/scramble/README.md` is unchanged create-next-app boilerplate.

Next config of note (`next.config.ts`): `cacheComponents`, `partialPrefetching`, `experimental.globalNotFound`, Tailwind via a Turbopack CSS loader, and the next-intl plugin. The middleware file is `proxy.ts` (the Next 16 name). Imports use the `@/*` alias to the app root.

### Game rules (`lib/game/rules.ts`)
- Board sizes: `standard` 4×4, `large` 5×5, `huge` 6×6 (`lib/boardSizes.ts`).
- Words are paths through adjacent tiles (8 directions), each tile used once, at least `MIN_WORD_LENGTH` = 3 letters.
- 3-minute game (`GAME_DURATION_MS`). A correct word scores `2^length`, a wrong guess `-length`.
- Grades are 10% bands of the board's maximum points, plus a "perfect" grade.

### Routing and i18n
- Locales are `fi` (default), `sv`, `en`. `lib/languages.ts` is the single source, and it also drives the DB enum and next-intl routing (`i18n/`).
- Pages are `app/[locale]/page.tsx` (start), `/game` and `/results`. Each wraps its screen component in `SlideView` (a React `ViewTransition`). It has to be per page, not in the layout.
- UI strings live in `messages/{fi,sv,en}.json`. Keep all three in sync when you add keys. `app/global-not-found.tsx` renders every language because it has no locale.

### Client game state (`lib/game/`)
- `state.ts` has pure state transitions (`startGame`, `addGuess`, `finishGame`, ...). `store.ts` has `GameStore`, one per language+size, persisted to `sessionStorage` under `scramble:{lang}:{size}:v1`. `useGame.ts` exposes it through `useSyncExternalStore`, and `state` is `null` until hydrated.
- The deadline is an absolute epoch time, so reloading neither pauses nor resets the clock.
- The store prefetches the next plane (`nextPlane`) so starting a game is instant.
- The chosen board size is kept in `localStorage` (`boardSizePreference.ts`).
- Game state decides the route: screens redirect with `router.replace` when there's no game or it has finished. Next keeps hidden pages mounted (Activity), so components clear local UI state in `useLayoutEffect` cleanups.

### Plane ("board") generation and the API
- `GET /api/plane?lang=..&size=..` (`app/api/plane/route.ts`) returns `{ plane, wordList, slugs?, tries, points }`.
- `lib/generatePlane.ts` builds random grids from weighted letters (`lib/letters.ts`) and finds every word with a DFS pruned by prefix binary search (`lib/binarySearch.ts`). It retries until the grid reaches `MIN_POINTS[size][lang]`, up to `MAX_TRIES` = 500, and keeps the best attempt.
- `lib/planePool.ts` keeps `POOL_SIZE` = 3 pre-generated planes per language+size in Postgres. A request claims a `ready` row atomically (`FOR UPDATE SKIP LOCKED`) and regenerates it afterwards with `after()`. Rows stuck in `used` for over a minute are healed. Top-ups are serialised with an advisory lock.
- If `POSTGRES_URL` is unset or the DB fails, the route generates a plane directly. The app works locally without a database.

### Database (`lib/db/`)
- Drizzle + `postgres` against Supabase. `POSTGRES_URL` is the pooled connection (needs `prepare: false`). `POSTGRES_URL_NON_POOLING` is used for migrations. Both come from `.env` or the shell.
- There is a single table, `planes`. Migrations are in `drizzle/`. Generate them with drizzle-kit rather than writing them by hand.

### Word data (`lib/data/`)
- `{lang}/{size}/words.json`: the words that fit on that board size, **sorted by UTF-16 code unit (plain `.sort()`)**, not by locale order. The binary search depends on this.
- `{lang}/{size}/letters.json`: `{ letters, cumulative }` letter frequencies used for weighted random tiles.
- `en-slugs.json`: word → dictionary.com slug, only where they differ. It's used for result links (`dictionaryUrl` in `rules.ts`).
- These files are generated. Don't edit them by hand. To regenerate, put the `{fi,sv,en}-all-words.json` inputs in `lib/data/` and run `node fix-word-files.mjs` **from inside `lib/data/`**, because it uses relative paths.
- `BOARD_SIZES` in `fix-word-files.mjs` must match `BOARD_DIMENSIONS` in `lib/boardSizes.ts`.

### Word data pipeline (`local-files/`, not in git)
`fetch-*.mjs` scrape the source dictionaries (Kielitoimiston sanakirja for fi, SAOL for sv, dictionary.com/Cambridge for en). The `*-word-cleaner.mjs` scripts then normalise the lists into the `*-all-words.json` inputs and `en-slugs.json`, which go into `apps/scramble/lib/data/`.

### Styling
- Tailwind 4, with theme colours and fonts as CSS variables in `app/globals.css` (light and dark via `prefers-color-scheme`). Layout classes such as `.game-screen`, `.board` and `.tile` are also there.
- `components/buttonClass.ts` and `components/panelClass.ts` hold the shared class strings.
- Browser support comes from the `browserslist` in `package.json`. It sets the build targets and the minimum versions for `OutdatedBrowserWarning` (`lib/browserSupport.ts`). IE is blocked with CSS alone in the layout.

## main-site (`apps/main-site`)
- `index.html` (sv) and `en/index.html` (en) share one structure, so layout changes go in both. `404.html` is shared.
- `vite.config.ts` builds all three pages and inlines small entry scripts into the HTML.
- See `apps/main-site/README.md` for deployment (upload `dist/` contents, `.htaccess`, CV).
