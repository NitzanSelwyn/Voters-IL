# Voters-IL

A Hebrew (RTL) interactive dashboard for visualizing and comparing Israeli Knesset election results across rounds 20-25 (2015-2022).

## Screenshots

> Run `npm run dev` and visit `http://localhost:5173` to see the dashboard.

## Features

- **National Overview** - Summary stats, seats bar chart, vote share donut, turnout trend across all rounds
- **City Deep Dive** - Per-city party results, historical trends, turnout comparison, ballot box table
- **Party Tracker** - Bump ranking, geographic heatmap, top cities per party
- **Round Comparison** - Vote shift diverging bars, new/gone parties between any two rounds
- **Interactive Map** - Leaflet map with circle markers colored by winning party, side panel details
- **Search** - Fuzzy Hebrew city search powered by Fuse.js

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS 4 |
| Charts | Nivo (bar, pie, line, bump, heatmap) |
| Map | React-Leaflet + Leaflet |
| Search | Fuse.js (fuzzy Hebrew search) |
| Routing | React Router v7 |
| Font | Noto Sans Hebrew (via fontsource) |

## Data Source

All election data comes from [data.gov.il](https://data.gov.il/dataset/votes-knesset), the official Israeli government open data portal.

### How the data is fetched

The data is fetched using the **CKAN datastore API**, not direct download URLs (which return bot-protection HTML pages).

**API endpoint:**
```
https://data.gov.il/api/3/action/datastore_search?resource_id={id}&limit=10000&offset=0
```

Each Knesset round has two datasets:
- **"לפי יישובים"** (by settlements) - Aggregated votes per party per city (~1,200 rows, ~150KB)
- **"לפי קלפיות"** (by ballot boxes) - Per-ballot-box detailed data (~10K-13K rows, ~3MB)

The preprocessing script (`scripts/preprocess.ts`) fetches all 12 datasets (6 rounds x 2 types), extracts party vote columns by filtering out known metadata fields (settlement name/code, eligible voters, total votes, invalid votes, valid votes), and outputs structured JSON files.

### Resource IDs

| Knesset | Per-city resource | Per-ballot-box resource |
|---------|-------------------|------------------------|
| 25 (2022) | `b392b8ee-ba45-4ea0-bfed-f03a1a36e99c` | `cc223336-07bc-485d-b160-62df92967c0a` |
| 24 (2021) | `9921a347-8466-4ef4-81f9-22523c5c4632` | `419be3b0-fd30-455a-afc0-034ec36be990` |
| 23 (2020) | `3dc36e20-25d6-4496-ba6a-71d9bc917349` | `3b9e911a-2e90-4587-b209-84171664056b` |
| 22 (2019) | `bd22cd14-138c-4917-931a-ef628c2a5a30` | `22f3a195-3a79-436c-be23-cb606bc7b398` |
| 21 (2019) | `1a1c7b2b-e819-4ba9-b159-d68e3566c58b` | `f79f9ba5-fe12-4b90-96cc-916f1b7c1c34` |
| 20 (2015) | `929b50c6-f455-4be2-b438-ec6af01421f2` | `c3db5581-f48d-45fc-b221-e7635e940c41` |

### Output structure

The preprocessing script outputs static JSON files to `public/data/`:

```
public/data/
  meta.json                  # Rounds metadata, party metadata (name/color/seats), city list
  rounds/20.json...25.json   # Per-city vote totals per round (~300KB each)
  ballotboxes/20.json...25.json  # Per-ballot-box data (~3MB each)
```

Party metadata (Hebrew/English names, brand colors, seats per round) is manually curated in `scripts/party-meta.ts`.

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Install

```bash
npm install
```

### Generate data (optional - data is already committed)

```bash
npm run preprocess
```

This fetches all election data from data.gov.il and generates the JSON files in `public/data/`. The data is already committed to the repo, so you only need to run this if you want to refresh it.

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`.

### Build

```bash
npm run build
```

Output goes to `dist/`.

### Deploy to Vercel

Connect the GitHub repo to Vercel. No special configuration needed - Vite is auto-detected. The static JSON data in `public/data/` is included in the build output automatically.

## Project Structure

```
scripts/
  party-meta.ts          # Curated party metadata (names, colors, seats)
  preprocess.ts          # CKAN API -> JSON pipeline
public/data/             # Generated static JSON (committed)
src/
  types/index.ts         # TypeScript interfaces
  data/
    loader.ts            # Fetch + cache JSON files
    hooks.ts             # useMetaData, useRoundData, useBallotBoxData, etc.
  components/
    layout/              # Header, Footer, ThemeProvider, PageContainer
    charts/              # Nivo chart wrappers (SeatsBar, VoteSharePie, etc.)
    search/              # SearchBar with Fuse.js autocomplete
    shared/              # RoundSelector, StatCard, PartyBadge, etc.
  features/
    national/            # Landing page - national overview dashboard
    city/                # City deep-dive with ballot box table
    party/               # Party tracker with bump chart and heatmap
    compare/             # Round comparison with vote shift bars
    map/                 # Interactive Leaflet map
    search/              # Search page with alphabetical index
  hooks/                 # useTheme, useMediaQuery, useLocalStorage
  router.tsx             # React Router with lazy-loaded routes
```

## License

Data is provided by the Israeli government under open data terms via data.gov.il.
