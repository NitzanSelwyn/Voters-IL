# Voters-IL

A Hebrew (RTL) interactive dashboard for visualizing and comparing Israeli Knesset election results across **11 rounds** — Knesset 15 through 25 (1999-2022).

## Features

- **National Overview** — Summary stats, seats bar chart, vote share donut, turnout trend across all rounds
- **City Deep Dive** — Per-city party results, historical trends, turnout comparison, ballot box table
- **Party Tracker** — Bump ranking, geographic heatmap, top cities per party
- **Round Comparison** — Vote shift diverging bars, new/gone parties between any two rounds
- **Interactive Map** — Leaflet map with circle markers colored by winning party, side panel details
- **Search** — Fuzzy Hebrew city search powered by Fuse.js, with alias support for historical name variants
- **Data Completeness Indicators** — Banners and graceful handling for rounds with incomplete data (e.g., K17 missing eligible voter counts)
- **Compact Number Formatting** — Vote counts displayed as `50.1K`, `1.2M` on charts; full locale-formatted numbers in tables

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
| XLS Parsing | xlsx (SheetJS) — for Knesset 15 data |

## Data Source

All election data comes from [data.gov.il](https://data.gov.il/dataset/votes-knesset), the official Israeli government open data portal, except for Knesset 15 which is sourced from [odata.org.il](https://www.odata.org.il/) as an XLS file.

### How the data is fetched

The data is fetched using the **CKAN datastore API**, not direct download URLs (which return bot-protection HTML pages).

**API endpoint:**
```
https://data.gov.il/api/3/action/datastore_search?resource_id={id}&limit=10000&offset=0
```

Each Knesset round has up to two datasets:
- **"לפי יישובים"** (by settlements) — Aggregated votes per party per city (~1,200 rows). Available for K19-25.
- **"לפי קלפיות"** (by ballot boxes) — Per-ballot-box detailed data (~7K-13K rows). Available for K15-25.

For older rounds (K15-18) that lack a per-city resource, the preprocessing script aggregates ballot-box data into per-city totals automatically.

### Resource IDs

| Knesset | Year | Per-city (factions) | Per-ballot-box (individuals) | Notes |
|---------|------|---------------------|------------------------------|-------|
| 25 | 2022 | `b392b8ee-ba45-4ea0-bfed-f03a1a36e99c` | `cc223336-07bc-485d-b160-62df92967c0a` | |
| 24 | 2021 | `9921a347-8466-4ef4-81f9-22523c5c4632` | `419be3b0-fd30-455a-afc0-034ec36be990` | |
| 23 | 2020 | `3dc36e20-25d6-4496-ba6a-71d9bc917349` | `3b9e911a-2e90-4587-b209-84171664056b` | |
| 22 | 2019b | `bd22cd14-138c-4917-931a-ef628c2a5a30` | `22f3a195-3a79-436c-be23-cb606bc7b398` | |
| 21 | 2019a | `1a1c7b2b-e819-4ba9-b159-d68e3566c58b` | `f79f9ba5-fe12-4b90-96cc-916f1b7c1c34` | |
| 20 | 2015 | `929b50c6-f455-4be2-b438-ec6af01421f2` | `c3db5581-f48d-45fc-b221-e7635e940c41` | |
| 19 | 2013 | `c20cdcef-4d42-4241-a41b-6ca7ae51002d` | `432d3185-545a-41d9-8c72-d10ee515919c` | Identical schema to K20-25 |
| 18 | 2009 | — | `840edb33-90ac-4176-8ad9-4cdcb8e5caa5` | No per-city resource; aggregated from ballot boxes |
| 17 | 2006 | — | `70f8bc93-8d98-4c20-ad7c-768af713f1c5` | Missing eligible voters, city codes, invalid votes |
| 16 | 2003 | — | `498b48e9-5af6-474d-b7a4-5ac1e21d3a08` | No per-city resource; city codes unreliable |
| 15 | 1999 | — | — | XLS from odata.org.il, saved locally in `scripts/data/` |

### Historical data schema differences

The CKAN API schema varies across rounds. The preprocessing script normalizes all variants into a unified format:

| Round | Field Types | Eligible Voters | Ballot Box # | City Code | Special Notes |
|-------|-------------|-----------------|--------------|-----------|---------------|
| K20-25 | `text` | `בזב` | `מספר קלפי` | `סמל ישוב` | Baseline schema |
| K19 | `text` | `בזב` | `מספר קלפי` | `סמל ישוב` | Meretz ballot letter = `מרץ` (normalized to `מרצ`) |
| K18 | `numeric` | `בז''ב` | `סמל קלפי` | `סמל ישוב` | Extra `ת. עדכון` timestamp field |
| K17 | `numeric` | **MISSING** | `מספר קלפי` | **MISSING** | Only has: city name, address, voters, valid votes, parties |
| K16 | `numeric` | `בוחרים` | `סמל קלפי` | `סמל ישוב` (buggy) | City code `"0.0"` for special ballot boxes |
| K15 | `numeric` | `ב ז ב` (spaces) | `קלפי` | `סמל ישוב` | XLS with trailing spaces in headers, has district codes |

### Data completeness

Each round carries `dataCompleteness` metadata in `meta.json`:

| Round | Eligible Voters | City Codes | Invalid Votes | Source |
|-------|----------------|------------|---------------|--------|
| K19-25 | Yes | Yes | Yes | CKAN API |
| K18 | Yes | Yes | Yes | CKAN API (aggregated from ballot boxes) |
| **K17** | **No** | **No** | **No** (derived) | CKAN API (aggregated, city names matched by fuzzy lookup) |
| K16 | Yes | Yes | Yes | CKAN API (aggregated from ballot boxes) |
| K15 | Yes | Yes | Yes | XLS (parsed and aggregated from ballot boxes) |

K17 is the most problematic round — turnout percentage cannot be calculated and city codes are matched heuristically from city names. The frontend shows a warning banner when viewing K17 data.

### Canonical city list

The project uses K25 election data as the **canonical source** for city names and codes. A separate script (`scripts/build-cities.ts`) builds `public/data/cities.json` with:

- **1,216 cities** from the K25 factions resource
- **Normalized display names** — fixes run-together words, restores dashes in compound names (e.g., `פרדס חנהכרכור` → `פרדס חנה-כרכור`), restores quotation marks (e.g., `כפר חבד` → `כפר חב"ד`), and handles Arabic al- prefixes
- **107 manual name overrides** for names that can't be normalized automatically
- **Search aliases** — historical name variants (from K15-K24) and raw K25 names are stored as aliases in `meta.json`, so fuzzy search finds cities by any known spelling

The final `meta.json` contains **1,260 cities** (1,216 from K25 + 44 historical-only settlements like former Gush Katif communities).

### Output structure

```
public/data/
  cities.json                  # Canonical city list from K25 (1,216 cities)
  meta.json                    # Rounds metadata, party metadata, city list with aliases
  rounds/15.json...25.json     # Per-city vote totals per round
  ballotboxes/15.json...25.json  # Per-ballot-box data
```

Party metadata (Hebrew/English names, brand colors, seats per round, historical aliases) is manually curated in `scripts/party-meta.ts`. This covers 30 parties across all 11 rounds, including parties that changed names or composition (e.g., `אמת` = "One Israel" in K15, "Labor-Meimad" in K16-17, "Labor" in K18+).

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Install

```bash
npm install
```

### Generate data

#### 1. Build canonical city list (one-time or when updating)

```bash
npx tsx scripts/build-cities.ts
```

Fetches K25 data from CKAN API, normalizes city names, and writes `public/data/cities.json`.

#### 2. Run full preprocessing

```bash
npm run preprocess
```

Fetches all election data from data.gov.il (K16-25 via CKAN API) and parses K15 from the local XLS file (`scripts/data/knesset-15.xls`). Generates JSON files in `public/data/`. Also applies the canonical city list for `meta.json`.

#### 3. Fix coordinates (optional)

```bash
npx tsx scripts/fix-coords.ts
```

Patches `meta.json` with hardcoded coordinates for ~500 Israeli settlements. This is run after preprocessing to ensure maximum coordinate coverage for the map view.

> **Note:** The generated data files are committed to the repo. You only need to run these scripts if you want to refresh the data.

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

Connect the GitHub repo to Vercel. No special configuration needed — Vite is auto-detected. The static JSON data in public/data/ is included in the build output automatically.

Live Demo: https://voters-il.vercel.app/

## Project Structure

```
scripts/
  party-meta.ts          # Curated party metadata (names, colors, seats) for K15-25
  build-cities.ts        # Canonical city list builder from K25 data
  preprocess.ts          # CKAN API + XLS -> JSON pipeline for all 11 rounds
  fix-coords.ts          # Patch meta.json with settlement coordinates
  data/
    knesset-15.xls       # K15 raw data (XLS from odata.org.il, committed)
public/data/             # Generated static JSON (committed)
  cities.json            # Canonical city list
  meta.json              # Rounds, parties, cities metadata
  rounds/                # Per-city data per round (15.json - 25.json)
  ballotboxes/           # Per-ballot-box data per round (15.json - 25.json)
src/
  types/index.ts         # TypeScript interfaces
  data/
    loader.ts            # Fetch + cache JSON files
    hooks.ts             # useMetaData, useRoundData, useBallotBoxData, useFuseSearch
  components/
    layout/              # Header, Footer, ThemeProvider, PageContainer
    charts/              # Nivo chart wrappers (SeatsBar, VoteSharePie, etc.)
    search/              # SearchBar with Fuse.js autocomplete
    shared/              # RoundSelector, StatCard, PartyBadge, DataWarningBanner,
                         # ElectionInfoCard, NumberDisplay, LoadingSkeleton
  features/
    national/            # Landing page — national overview dashboard
    city/                # City deep-dive with ballot box table
    party/               # Party tracker with bump chart and heatmap
    compare/             # Round comparison with vote shift bars
    map/                 # Interactive Leaflet map
    search/              # Search page with alphabetical index
  lib/
    utils.ts             # formatCompactNumber, formatFullNumber, getPartyName, etc.
    chartTheme.ts        # Nivo chart theme (light/dark mode)
  hooks/                 # useTheme, useMediaQuery, useLocalStorage
  router.tsx             # React Router with lazy-loaded routes
```

## License

Data is provided by the Israeli government under open data terms via data.gov.il.

I've added a "Live Demo" line under "Deploy to Vercel" with the link. This makes it easy for visitors to your repository to see the project in action!
