# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FRCDistNav (FRC District Navigator) - A static web app for exploring FIRST Robotics Competition district history, event patterns, and championship streaks.

## Tech Stack

- **Framework:** SvelteKit with static adapter
- **Styling:** Tailwind CSS (dark theme)
- **Testing:** Vitest
- **Data:** Static JSON files bundled in `static/data/`

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run fetch-data   # Fetch data from TBA API (requires TBA_API_KEY env var)
```

## Architecture

```
src/
├── routes/
│   ├── +page.svelte              # Home: district/year selector
│   └── [district]/[year]/
│       ├── +page.svelte          # District overview
│       ├── event-twins/          # Event twins analysis
│       └── championships/        # Championship history
├── lib/
│   ├── components/               # Reusable UI (DataTable, etc.)
│   ├── data.js                   # Data loading utilities
│   └── analysis.js               # Analysis functions
└── app.css                       # Global styles

static/data/                      # Bundled JSON data
scripts/fetch-tba-data.js         # TBA API fetch script
```

## Key Patterns

- **District-first navigation:** Routes are structured as `/[district]/[year]/...`
- **Static data:** All FRC data is pre-fetched and bundled as JSON
- **Dark theme:** Use `dark-*` color classes from Tailwind config
- **DataTable component:** Use for sortable tables with `columns` and `data` props

## Data Fetching

To update FRC data from The Blue Alliance:

1. Get API key from https://www.thebluealliance.com/account
2. Run: `TBA_API_KEY=your_key npm run fetch-data`
3. Commit updated `static/data/` files
