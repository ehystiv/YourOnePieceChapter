# Your One Piece Chapter

Enter a date (your birthday, for example) and find out which One Piece chapter was on newsstands in Japan that week, in Weekly Shōnen Jump.

**Live site: https://your-one-piece-chapter.ehystiv.dev/**

It is a static site with no build step and no dependencies: plain HTML, CSS and JavaScript modules, plus one JSON file with the chapter data. The interface is available in English and Italian.

Want to help, for example by adding a language? See [CONTRIBUTING.md](CONTRIBUTING.md).

## How it works

- The dataset lists every chapter with its Japanese release date (`releaseDate`, a plain calendar date with no time zone).
- For the chosen date, a binary search finds the last chapter released on or before that day:
  - released **that very day** → the card shows "ドン!";
  - released **within the previous 6 days** → "out that week";
  - **7 days or more** → One Piece was on break that week: the card shows the chapter still on newsstands and when the next one came out.
- Dates before chapter 1 (19 July 1997) show how many days were left, and mention the *Romance Dawn* one-shot when it applies.
- Chapters with a future date are marked as scheduled. Dates past the last known chapter say that week's chapter has not been announced yet.

Release dates cannot be computed with a "one chapter per week" rule: breaks are irregular (author breaks, double issues, the month-long break in July 2022), so the site relies on the real dates.

The chosen date is stored in the URL hash, for example `/#1997-07-25`, so links can be shared and work on any static host without rewrite rules.

## Project structure

| Path | Contents |
|---|---|
| `public/` | **The folder that gets published**, as is. |
| `public/index.html`, `public/styles.css` | Page and styling: wanted poster, nautical chart background, newspaper clipping for break weeks. |
| `public/lookup.js` | Pure lookup logic (binary search on dates), shared by the site and the tests. |
| `public/app.js` | UI: loads `chapters.json`, renders the card, handles navigation and the language switch. |
| `public/i18n.js` | UI strings for each language (English is the default). The language picked with the switch is remembered in the browser. |
| `public/chapters.json` | Chapter dataset. |
| `scripts/update-chapters.mjs` | Updates `public/chapters.json` from the One Piece wikis. |
| `scripts/clean-title.mjs` | Turns wiki markup in titles into plain text. |
| `tests/` | Tests for the logic and the dataset (`node --test`). |
| `HANDOFF.md` | Original project brief (in Italian). |

## Commands

Requires Node 18 or later (only for tests and data updates) and Python 3 (only for the local server).

```bash
npm run dev          # http://localhost:8080 (a server is needed: with file:// the JSON fetch fails)
npm test             # lookup and dataset tests
npm run update-data  # update public/chapters.json from the wikis
```

## Data

Each chapter in `chapters.json` has:

| Field | Source |
|---|---|
| `releaseDate` | `Template:WhichMangaDate` on the English [One Piece Wiki](https://onepiece.fandom.com/) |
| `titleEn`, `titleJa` | `{{Chapter Box}}` on the English wiki pages `Chapter_N` (English titles for chapters 1–1145 come from a curated translation) |
| `titleIt` | `{{Profilo capitolo}}` on the [One Piece Wiki Italia](https://onepiece.fandom.com/it/) pages `Capitolo_N` |
| `cover` | URL and size of `Chapter_N.png` on the English wiki |

The site shows the title in the selected language together with the Japanese one, and links to the chapter page on the wiki in the same language. When a translated title is still missing, it falls back to the English title and the English wiki.

Covers are loaded straight from Fandom's CDN (`static.wikia.nocookie.net`), resized by their server: no images are stored in this repository. Covers are © Eiichiro Oda / Shueisha, and the card says so in its caption.

`update-data` always refreshes every release date, but only downloads titles and covers that are missing (new chapters, or chapters without a title yet). Titles already in the file are kept, so the curated English titles are not replaced by the wiki ones. To download everything again:

```bash
node scripts/update-chapters.mjs --all-titles
```

## Deployment

The site is published with GitHub Pages through GitHub Actions. The custom domain and enforced HTTPS are set in *Settings → Pages*, and `ehystiv.github.io/YourOnePieceChapter/` redirects there.

- [`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs the tests and publishes `public/` on every push to `main` that touches the site. It can also be started by hand from *Actions*.
- [`.github/workflows/update-data.yml`](.github/workflows/update-data.yml) refreshes `chapters.json` every Monday at 06:00 UTC. If any chapter changed, it commits the file and redeploys the site. It can be started by hand from *Actions → Update chapter data → Run workflow*.

GitHub disables scheduled workflows after 60 days without activity in the repository. If that happens, re-enable it from the *Actions* tab.

`public/` can also be published as is on any other static host.

## License and credits

Release dates and titles come from the [One Piece Wiki](https://onepiece.fandom.com/) and the [One Piece Wiki Italia](https://onepiece.fandom.com/it/), under the CC BY-SA license. Chapter covers are © Eiichiro Oda / Shueisha.

This is an unofficial fan-made project, not affiliated with Eiichiro Oda, Shueisha or Toei Animation.
