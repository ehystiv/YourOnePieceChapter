# Contributing

Thanks for helping! This is a small fan project, so contributions of any size are welcome: a typo, a translation, a new language, a design idea, a bug report.

## Before you start

- The site is plain HTML, CSS and JavaScript modules: no framework, no bundler, no `npm install`.
- You need **Node 18+** for tests and data updates, and **Python 3** for the local server.
- Read the [README](README.md) for how the lookup works and where the data comes from.

```bash
npm run dev    # http://localhost:8080
npm test       # run it before every pull request
```

Open the page through the local server, not by double-clicking `index.html`: with `file://` the browser refuses to load `chapters.json`.

## Ground rules

- **No official logos or character art in the repository.** The chapter covers are hotlinked from the One Piece Wiki with a credit; don't commit images, fonts or other assets taken from the manga, the anime or Shueisha.
- **Credit your sources.** Data comes from the One Piece wikis under CC BY-SA. If you add a source, credit it in the page footer (`source` in `public/i18n.js`) and in the README.
- **Keep it static.** Everything must keep working when `public/` is served as is by any static host.
- **Be gentle with the wikis.** Don't make the site call the Fandom API from the browser; data is fetched once a week by `scripts/update-chapters.mjs` and stored in `chapters.json`.

## Adding a language

A language has two parts: the **interface strings** and, optionally, **chapter titles** from a One Piece wiki in that language. The steps below use French (`fr`) as an example: check the real page names and field names on the wiki you use.

### 1. Find the wiki and its chapter pages

Look for a One Piece wiki in your language that has one page per chapter, with the title in a template. For each wiki you need:

- the API endpoint, for example `https://onepiece.fandom.com/fr/api.php`;
- how chapter pages are named, for example `Chapitre_1053`;
- the template field that holds the translated title, for example `titre`.

You can inspect a page's template from the API:

```text
https://onepiece.fandom.com/fr/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&rvsection=0&format=json&formatversion=2&titles=Chapitre_1053
```

If there is no such wiki, you can still translate the interface: titles will fall back to English (see step 3).

### 2. Download the titles

Add the wiki to `WIKIS` in [`scripts/update-chapters.mjs`](scripts/update-chapters.mjs). The key of `fields` becomes the field name in `chapters.json`:

```js
const WIKIS = {
  en: { /* … */ },
  it: { /* … */ },
  fr: { api: 'https://onepiece.fandom.com/fr/api.php', page: n => 'Chapitre_' + n, fields: { titleFr: 'titre' } },
};
```

Then run:

```bash
npm run update-data
```

Since no chapter has `titleFr` yet, the script downloads it for every chapter (about 25 requests of 50 pages each, with a short pause between them). It keeps all existing titles and covers.

Check the output:

- `Markup non gestito nel capitolo …` warnings mean the cleaner left wiki markup in a title. Handle the new case in [`scripts/clean-title.mjs`](scripts/clean-title.mjs) and add an example to the `cleanTitle` test in `tests/lookup.test.mjs`.
- Spot-check a few titles in `public/chapters.json`, for example chapters 1, 1000 and the latest one.

### 3. Translate the interface

In [`public/i18n.js`](public/i18n.js):

1. Add the language code to `LANGS`.
2. Copy the whole `en` block into a new `fr` block and translate every value. Some values are functions that build sentences from formatted numbers and dates: keep the parameters, translate the text around them.
3. Set the three language-specific settings:

```js
fr: {
  locale: 'fr-FR',                                                    // date and number formatting
  titleField: 'titleFr',                                              // chapter title field from step 2 ('titleEn' if there is none)
  wikiUrl: n => `https://onepiece.fandom.com/fr/wiki/Chapitre_${n}`,  // "read the wiki page" link
  // …all the other keys, translated
},
```

When a chapter has no title in the selected language (for example a brand-new chapter the wiki hasn't covered yet), the site shows the English title and links to the English wiki. Nothing else is needed for that.

Keep `source` (the footer credit) accurate: mention the wiki the translated titles come from.

### 4. Add the switch button

In [`public/index.html`](public/index.html), add a button to the language switch:

```html
<nav class="lang" …>
  <button type="button" data-lang="en" lang="en" aria-pressed="true">EN</button>
  <button type="button" data-lang="it" lang="it" aria-pressed="false">IT</button>
  <button type="button" data-lang="fr" lang="fr" aria-pressed="false">FR</button>
</nav>
```

### 5. Test

```bash
npm test
```

[`tests/i18n.test.mjs`](tests/i18n.test.mjs) checks every language automatically:

- the block has exactly the same keys, with the same types, as English;
- there is a switch button for it;
- the `locale` is valid, `titleField` exists in `chapters.json`, and `wikiUrl` returns a link.

Then open the site with `npm run dev`, pick the new language and check at least these dates, on a desktop and a phone-sized window:

| Date | What you should see |
|---|---|
| `1997-01-27` | "Uncharted waters" map, before chapter 1 |
| `2021-01-04` | Chapter 1000, released that day ("ドン!") |
| `2022-07-04` | Chapter 1053, break week (newspaper clipping) |
| the next chapter's date | Scheduled chapter (message in a bottle) |

Long words can overflow on narrow screens: look at the stamp on the cover, the button label and the newspaper headline.

### 6. Update the docs

Add the language and its title source to the **Data** and **License and credits** sections of the README.

## Changing the data

- Never edit `public/chapters.json` by hand for routine updates: the weekly workflow regenerates it. If a value is wrong, fix it on the wiki when you can, then run `npm run update-data`.
- Changes to the script should keep existing titles unless `--all-titles` is passed: the English titles for chapters 1–1145 come from a curated translation.
- `npm test` fails if a title still contains wiki markup, or if a released chapter is missing a title or a cover.

## Commits and pull requests

1. Fork the repository and create a branch from `main`.
2. Make one change per commit, and run `npm test`.
3. Open a pull request describing what changed and, for visual changes, include a screenshot (desktop and phone).

Commit messages follow this format:

```text
<type>(<scope>): <emoji> <description>
```

- **Types:** `feat` ✨, `fix` 🐛, `refactor` ♻️, `style` 💄, `test` ✅, `docs` 📝, `chore` 🔧.
- **Scopes:** `site`, `data`, `deploy`, `repo` (listed in [`.vscode/settings.json`](.vscode/settings.json)).
- **Description:** in English, imperative mood, lowercase, no final period.

For example:

```text
feat(site): ✨ add French translation
feat(data): ✨ add French chapter titles from One Piece Wiki FR
```

Adding a language usually means two commits like these: one for the data (`scripts/update-chapters.mjs`, `public/chapters.json`) and one for the interface (`public/i18n.js`, `public/index.html`, README).
