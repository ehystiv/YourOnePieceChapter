# Il tuo capitolo di One Piece

Sito statico, senza build e senza dipendenze. Inserisci una data e il sito mostra il capitolo di One Piece che era in edicola in Giappone quella settimana (Weekly Shōnen Jump). Dettagli su dati e logica in [HANDOFF.md](HANDOFF.md).

## Struttura

| Percorso | Contenuto |
|---|---|
| `public/` | **La cartella da pubblicare**, così com'è. |
| `public/index.html`, `styles.css` | Pagina e stile (carta d'epoca, nessuna immagine ufficiale). |
| `public/lookup.js` | Logica di ricerca pura (ricerca binaria sulle date), usata dal sito e dai test. |
| `public/app.js` | Interfaccia: legge `chapters.json`, mostra la scheda, gestisce la navigazione e il cambio lingua. |
| `public/i18n.js` | Testi dell'interfaccia in inglese (predefinito) e italiano. La scelta fatta con lo switch EN/IT resta salvata nel browser. |
| `public/chapters.json` | Dataset dei capitoli. |
| `scripts/update-chapters.mjs` | Rigenera `public/chapters.json` dalla One Piece Wiki. |
| `tests/` | Test della logica (`node --test`). |

## Comandi

```bash
npm run dev          # http://localhost:8080 (serve un server: con file:// il fetch del JSON non funziona)
npm test             # test con i casi dell'HANDOFF
npm run update-data  # aggiorna public/chapters.json dalla wiki
```

Ogni capitolo ha tre titoli: `titleEn` e `titleJa` dalla [One Piece Wiki](https://onepiece.fandom.com/) inglese, `titleIt` dalla [One Piece Wiki Italia](https://onepiece.fandom.com/it/). Il sito mostra il titolo nella lingua scelta insieme a quello giapponese, e il link porta alla scheda sulla wiki della stessa lingua. Se il titolo italiano manca ancora, il sito usa quello inglese e il link porta alla wiki inglese.

La copertina (`cover`: URL e dimensioni) è l'immagine `Chapter_N.png` della wiki inglese. Il sito la carica direttamente dalla CDN di Fandom (`static.wikia.nocookie.net`), ridimensionata dal loro server: le immagini non sono copiate nella repo. Le copertine sono © Eiichiro Oda / Shueisha e la scheda lo indica nella didascalia.

`update-data` riprende sempre tutte le date, ma dalle wiki scarica solo i titoli e le copertine mancanti (capitoli nuovi o ancora senza titolo). I titoli inglesi di 1–1145 vengono da una traduzione curata e la wiki ne ha di diversi. Per riscaricarli comunque tutti:

```bash
node scripts/update-chapters.mjs --all-titles
```

## Link condivisibili

La data scelta finisce nell'hash dell'URL, per esempio `/#1997-07-25`. Funziona su qualunque hosting statico senza regole di rewrite.

## Pubblicazione

Il sito è online su **https://your-one-piece-chapter.ehystiv.dev/**, pubblicato con GitHub Pages tramite GitHub Actions. Il dominio personalizzato e l'HTTPS obbligatorio sono impostati in *Settings → Pages*, e `ehystiv.github.io/YourOnePieceChapter/` reindirizza lì.

- [`.github/workflows/pages.yml`](.github/workflows/pages.yml) esegue i test e pubblica `public/` a ogni push su `main` che tocca il sito (si può anche avviare a mano da *Actions*).
- [`.github/workflows/update-data.yml`](.github/workflows/update-data.yml) ogni lunedì alle 06:00 UTC rigenera `chapters.json` dalla wiki. Se i capitoli sono cambiati fa il commit e ripubblica il sito. Si può avviare a mano da *Actions → Update chapter data → Run workflow*.

Nota: GitHub sospende i workflow pianificati dopo 60 giorni senza attività nella repo. Se succede, riattivalo dalla scheda *Actions*.

`public/` resta comunque pubblicabile su qualsiasi altro hosting statico, così com'è.

## Licenza dei dati

Date e titoli vengono dalla [One Piece Wiki](https://onepiece.fandom.com/) (CC BY-SA). Pagina non ufficiale, realizzata da un fan.
