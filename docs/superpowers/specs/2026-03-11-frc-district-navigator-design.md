# FRC District Navigator - Design Specification

## Overview

FRCDistNav is a web application for exploring historical FIRST Robotics Competition (FRC) district data. It allows FRC community enthusiasts to analyze team participation patterns, district championship history, and cross-event relationships.

**Primary user:** FRC community enthusiasts exploring historical data and trends for curiosity/discovery.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Web app (SvelteKit static) | Easy sharing via URL, free hosting, good ecosystem |
| Framework | Svelte/SvelteKit | Clean syntax, fast, good D3/charting integration |
| Data source | The Blue Alliance API | Comprehensive FRC data |
| Data strategy | Pre-cached, bundled JSON | ~5-20MB total, historical data doesn't change |
| Hosting | GitHub Pages / Vercel | Free static hosting |
| Styling | Dark mode dashboard | Data-dense analytics aesthetic |

## Scope

**In scope (2 pages to start):**
1. Event Twins — find teams sharing the same 2 district events
2. Championship History — team qualification streaks, results, Worlds advancement

**Historical range:** All available TBA data (2009-present, when districts started)

**Districts:** All districts, with user filtering

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRCDistNav                           │
│                  (SvelteKit Static)                     │
├─────────────────────────────────────────────────────────┤
│  Routes                                                 │
│  ├── /                    → District/Year selector      │
│  ├── /[district]/[year]   → District overview           │
│  ├── /[district]/[year]/event-twins                     │
│  │                        → Teams sharing events        │
│  └── /[district]/[year]/championships                   │
│                           → Championship history        │
├─────────────────────────────────────────────────────────┤
│  Static Data (bundled JSON)                             │
│  ├── districts.json       → All districts by year       │
│  ├── events/              → Events per district/year    │
│  ├── teams/               → Teams per district/year     │
│  └── rankings/            → Championship results        │
├─────────────────────────────────────────────────────────┤
│  Deployment: GitHub Pages / Vercel (static)             │
└─────────────────────────────────────────────────────────┘
```

## Data Structure

**Directory layout:**
```
static/data/
├── districts.json          # List of all districts with metadata
├── fim/                    # Michigan
│   ├── 2024.json
│   ├── 2023.json
│   └── ...
├── ne/                     # New England
│   ├── 2024.json
│   └── ...
└── ...
```

**District/year file schema:**
```json
{
  "district": "fim",
  "year": 2024,
  "events": [
    {
      "key": "2024miket",
      "name": "Kettering District",
      "teams": [27, 33, 67, 469]
    }
  ],
  "championship": {
    "key": "2024micmp",
    "name": "Michigan State Championship",
    "rankings": [
      {"team": 27, "rank": 1, "record": "10-2-0", "advancedToWorlds": true},
      {"team": 33, "rank": 2, "record": "9-3-0", "advancedToWorlds": true}
    ]
  }
}
```

## Page Designs

### Home Page (`/`)

- District selector (radio buttons or cards for all districts)
- Year dropdown (2009-present)
- "Explore" button navigates to district overview

### District Overview (`/[district]/[year]`)

- Breadcrumb navigation (Home → District → Page)
- Navigation cards to Event Twins and Championship History pages
- District summary (team count, event count, championship info)
- Quick year toggle for browsing across years

### Event Twins Page (`/[district]/[year]/event-twins`)

**Two modes via tab toggle:**

1. **All Combinations view:**
   - Table of all event pairings in the district
   - Columns: Event Pairing, Team Count, View button
   - Sortable by team count
   - Click to expand/view team list for that pairing

2. **By Team view:**
   - Team selector (dropdown/search)
   - Shows the 2 events that team attended
   - Lists all teams sharing both events
   - Sortable table with team number, name, championship rank
   - Click a row to view that team's event twins

### Championship History Page (`/[district]/[year]/championships`)

**Two modes via tab toggle:**

1. **All Teams view:**
   - Sortable table of all teams in district
   - Columns: Team, Name, Qualification Streak, Best Finish, Worlds Advances
   - Click row for full team history

2. **By Team view (team detail):**
   - Current qualification streak
   - Total Worlds appearances
   - Year-by-year table: Year, Rank, Record, Playoff Result, Worlds?
   - Streak history (all qualification streaks)

## Project Structure

```
FRCDistNav/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # Home
│   │   └── [district]/[year]/
│   │       ├── +page.svelte          # District overview
│   │       ├── event-twins/+page.svelte
│   │       └── championships/+page.svelte
│   ├── lib/
│   │   ├── components/               # Reusable UI components
│   │   └── data.js                   # Data loading helpers
│   └── app.css                       # Global dark theme styles
├── static/
│   └── data/                         # Bundled JSON files
├── scripts/
│   └── fetch-tba-data.js             # TBA data fetch script
├── svelte.config.js
└── package.json
```

## Tech Stack

- **Framework:** SvelteKit with `@sveltejs/adapter-static`
- **Styling:** Tailwind CSS (dark theme)
- **Charts:** Chart.js or Layercake (Svelte-native)
- **Data:** Static JSON files bundled in `static/data/`

## Data Fetch Script

`scripts/fetch-tba-data.js` — a Node.js script to populate the data:

- Requires TBA API key (user provides their own for fetching)
- Pulls all districts, events, teams, and rankings from TBA
- Outputs organized JSON files to `static/data/`
- Run manually: `node scripts/fetch-tba-data.js`
- Run once initially, then yearly to add new seasons

## Deployment

1. `npm run build` generates static site in `build/`
2. Deploy to GitHub Pages, Vercel, or Netlify
3. No server required — fully static

## Future Considerations

Not in initial scope, but potential additions:
- Additional analysis pages based on discovered patterns
- Cross-district comparisons
- Team search across all districts
- Data export functionality
