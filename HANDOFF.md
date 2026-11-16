# One Piece – "Il tuo capitolo" · Handoff per Claude Code

Obiettivo: trasformare in app il prototipo web (`reference-index.html`). L'utente inserisce una data (per esempio il compleanno) e l'app mostra il capitolo di One Piece che era in edicola in Giappone quella settimana. Il calcolo è deterministico e non usa nessuna AI.

## File nel pacchetto

| File | Cosa contiene |
|---|---|
| `chapters.json` | Dataset completo: 1.199 capitoli con `chapter`, `releaseDate` (ISO, data giapponese), `titleEn`, `titleJa`. Il capitolo 1199 è futuro (23/11/2026) e ha i titoli `null`. |
| `update-chapters.mjs` | Script Node 18+ che rigenera `chapters.json` dalla One Piece Wiki. |
| `reference-index.html` | Prototipo funzionante: un solo file HTML con dati, logica e stile. |
| `HANDOFF.md` | Questo documento. |

## Come sono stati ottenuti i dati

1. **Date di uscita.** Vengono da `Template:WhichMangaDate` sulla One Piece Wiki (Fandom), un `#switch` MediaWiki con una riga per capitolo nel formato `|Chapter N=MM/DD/YYYY`. Il template contiene anche le date di alcuni speciali, come `Chapter 0` e `Romance Dawn Version 1=08/04/1996`. Sono le date di uscita giapponesi del Weekly Shōnen Jump. In genere cadono di lunedì; di sabato quando l'uscita viene anticipata per una festività.
   - Endpoint: `https://onepiece.fandom.com/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&titles=Template:WhichMangaDate`
   - Non si possono calcolare le date con una regola fissa del tipo "un capitolo a settimana": le pause sono irregolari (settimane di riposo dell'autore, numeri doppi, la pausa di un mese a luglio 2022). Servono le date reali.
2. **Titoli.**
   - Capitoli 1–1145: titoli inglesi e giapponesi dal repo GitHub [`nuotsu/onepiece-chapters`](https://github.com/nuotsu/onepiece-chapters) (`src/data/chapters.yml`).
   - Capitoli 1146–1198: campi `title` e `jname` del template `{{Chapter Box}}` delle pagine `Chapter_N` della wiki.
   - Lo script di aggiornamento prende tutti i titoli dalla wiki. Alcuni titoli inglesi possono quindi differire leggermente da quelli del dataset attuale (traduzione della wiki invece di quella di nuotsu). Il markup `{{Ruby|kanji|lettura}}` viene ridotto al solo kanji.
3. **Verifica fatta.** Ho confrontato a campione 14 capitoli con la fonte (1, 2, 100, 300, 500, 598, 700, 900, 1000, 1053, 1054, 1100, 1145, 1198, 1199) e coincidono tutti.

## Come funziona la ricerca (la parte da portare nell'app)

- Le date vanno trattate come **date di calendario, senza fuso orario**. Nel prototipo diventano `Date.UTC(...)` e si confrontano in giorni interi.
- Data scelta `D`, capitoli ordinati per data: con una **ricerca binaria** si trova l'ultimo capitolo `i` uscito il giorno `D` o prima.
- Con `since = giorni tra D e la data del capitolo i`:
  - `since === 0` vuol dire "Uscito proprio quel giorno".
  - `since < 7` vuol dire "Uscito quella settimana".
  - `since >= 7` vuol dire "Settimana di pausa": mostra il capitolo `i` come quello ancora in edicola e cita il successivo con la sua data.
- **Data prima del capitolo 1** (19/07/1997): mostra "Non ancora" e quanti giorni mancavano. Se la data è uguale o successiva al 04/08/1996, aggiunge una nota sul one-shot *Romance Dawn*.
- **Capitolo con data futura** (rispetto a oggi): va segnato come "previsto". Se la data scelta è oltre l'ultimo capitolo in archivio, l'app dice che il capitolo di quella settimana non è ancora stato annunciato.
- **Navigazione**: le frecce portano al capitolo precedente e al successivo (aggiornando la data). C'è anche un link alla scheda `https://onepiece.fandom.com/wiki/Chapter_N`.

## Interfaccia del prototipo

- Testi in italiano.
- Stile carta d'epoca e manga: sfondo color pergamena `#f3e9d2`, inchiostro `#1f2a3a`, rosso `#b3261e`, blu navy `#1d3557`.
- Font: Fraunces (titoli e numero del capitolo), Shippori Mincho (titolo giapponese), Inter (testo).
- Una scheda con bordo spesso e ombra piena, un'etichetta con lo stato (uscito, pausa, prima di tutto), il numero grande del capitolo, i due titoli, la data di uscita e le note.
- Nessun personaggio, logo o immagine ufficiale: va mantenuto così anche nell'app.

## Suggerimenti per l'app

- Includi `chapters.json` come asset locale, così l'app funziona offline. Puoi aggiornarlo in background da un endpoint tuo, rigenerato con `update-chapters.mjs` in un cron settimanale (per esempio il lunedì). L'app non dovrebbe interrogare direttamente l'API Fandom da ogni dispositivo.
- La One Piece Wiki ha licenza CC BY-SA: cita la fonte nell'app.
- Idee per i passi successivi (una alla volta): condivisione del risultato come immagine, salvataggio di più date (compleanni di amici), widget "capitolo di oggi".
- Test consigliati, tutti con la logica descritta sopra:
  - 27/01/1997 → nessun capitolo (mancano 173 giorni al capitolo 1).
  - 25/07/1997 → capitolo 1, uscito quella settimana.
  - 04/07/2022 → capitolo 1053, settimana di pausa (il 1054 è uscito il 25/07/2022).
  - 06/01/2021 → capitolo 1000.
  - 16/11/2026 → capitolo 1198, settimana di pausa (il 1199 è previsto per il 23/11/2026).
