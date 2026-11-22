# hakuni.se

Elias Hakuni's personal site: a static site in two languages, built with Vite, plain HTML, CSS and TypeScript.

- `/` – Swedish (`index.html`)
- `/en/` – English (`en/index.html`)

## Get started

```bash
npm install
npm run dev       # local server with hot reload
npm run build     # type-checks, then builds to dist/
npm run preview   # serves dist/ locally, to check the build
```

In a monorepo, put this folder under e.g. `apps/hakuni-site` and run the scripts through your workspace tool (`npm run dev -w hakuni-site`, `pnpm --filter hakuni-site dev`, etc.).

## Structure

```
index.html          Swedish page
en/index.html       English page
404.html            shared not-found page (Swedish with an English note)
src/main.ts         imports fonts and CSS, sets the year in the footer
src/styles.css      all styles; colours and fonts are CSS variables at the top
public/img/         project screenshots
public/favicon.svg  icon
public/CV.pdf       CV, linked from both pages
vite.config.ts      tells Vite to build both pages
```

The two HTML files have the same structure. If you change the layout, change both.

## Deploy

1. `npm run build`
2. Upload the **contents** of `dist/` to the web root of www.hakuni.se, so that `dist/index.html` ends up at `/` and `dist/en/index.html` at `/en/`.
3. `public/.htaccess` tells LiteSpeed/Apache to use `404.html` for missing pages. It replaces any `.htaccess` already in the web root, so put any rules your host needs in this file too.
4. The CV lives in `public/CV.pdf` (exactly that name, upper case), so it ends up in `dist/` with everything else. Both pages link to `https://www.hakuni.se/CV.pdf`.

## Notes

- The fonts (Fredoka and DM Sans) are self-hosted through `@fontsource`, so visitors' browsers don't contact Google.
- hreflang, canonical and Open Graph tags are in each page's `<head>`. If the domain or paths change, update them on both pages.
- When there's an English CV, or an English version of Scramble, update the links in `en/index.html`.
