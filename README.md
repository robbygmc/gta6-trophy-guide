# LEONIDA LEDGER — GTA VI Trophy Guide & Tracker

![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/robbygmc/gta6-trophy-guide/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/robbygmc/gta6-trophy-guide/reward.svg)

An offline web app: a guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden until earned. Built for the [make.fun bounty gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Every trophy with its official name, description and grade** as PlayStation publishes them, plus a guide written in our own words.
- **194 cited steps from 8 sources** — PowerPyx, Push Square, GTABase, KeenGamer, EGamers, GTASpotter, SixShore, Leonida Interactive — with a source matrix and a page for where the sources disagree (platinum time: ~200 h vs 250–300 h; meditation spots: 18 vs 15; the one possibly missable trophy). Five trophy methods are still unconfirmed and are marked so, not filled in with guesses.
- **Roadmap to the platinum** in 3 stages (story 60–80 h, cleanup ~100 h, platinum 10–20 h), built from the official descriptions: chapters and missions, collectibles and counts, in order — plus trophy targets against the 100% checklist.
- **Missable flags**: Positive Mental Attitude is the only trophy flagged as possibly missable (first meditation, Chapter 1 balcony) — with the manual-save protection and the honest note that Push Square reports none known.
- **Tracker**: checklist saved in localStorage, export to a JSON file and import it back, filters (story, missable, collectibles, activities, online), grade filter, search, and a spoiler setting that hides story trophies' names and descriptions until they are earned. Progress is shareable through the URL hash (`#earned=…`).
- **Fully offline**: static files under `app/`, no build step, no network request at run time. No Rockstar logo, artwork or game screenshots — the look is original.

## Run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`, unchanged from the kit).

## License

MIT — see [LICENSE](LICENSE).
