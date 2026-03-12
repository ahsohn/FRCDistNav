# FRC District Navigator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static web app for exploring FRC district history — event twins and championship streaks.

**Architecture:** SvelteKit static site with bundled JSON data. District-first navigation. Data fetched once from TBA API via build script, then served as static assets.

**Tech Stack:** SvelteKit, Tailwind CSS (dark mode), Chart.js, Node.js (data fetch script)

**Spec:** `docs/superpowers/specs/2026-03-11-frc-district-navigator-design.md`

---

## File Structure

```
FRCDistNav/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte            # Global layout with dark theme
│   │   ├── +page.svelte              # Home: district/year selector
│   │   └── [district]/[year]/
│   │       ├── +layout.svelte        # District layout with nav
│   │       ├── +page.svelte          # District overview
│   │       ├── +page.js              # Load district data
│   │       ├── event-twins/
│   │       │   └── +page.svelte      # Event twins analysis
│   │       └── championships/
│   │           └── +page.svelte      # Championship history
│   ├── lib/
│   │   ├── components/
│   │   │   ├── DataTable.svelte      # Sortable table component
│   │   │   ├── TeamSelector.svelte   # Team dropdown/search
│   │   │   └── YearToggle.svelte     # Year quick-switch
│   │   ├── data.js                   # Data loading utilities
│   │   └── analysis.js               # Analysis functions
│   └── app.css                       # Global styles + dark theme
├── static/
│   └── data/                         # Bundled JSON (generated)
│       ├── districts.json
│       └── [district]/[year].json
├── scripts/
│   └── fetch-tba-data.js             # TBA API fetch script
├── tests/
│   ├── lib/
│   │   ├── data.test.js
│   │   └── analysis.test.js
│   └── e2e/
│       └── navigation.test.js
├── svelte.config.js
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Chunk 1: Project Setup

### Task 1: Initialize SvelteKit Project

**Files:**
- Create: `package.json`
- Create: `svelte.config.js`
- Create: `vite.config.js`
- Create: `src/app.html`

- [ ] **Step 1: Create SvelteKit project**

Run:
```bash
npm create svelte@latest . -- --template skeleton --types typescript
```

Select: Skeleton project, TypeScript, ESLint, Prettier

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
```

- [ ] **Step 3: Verify project runs**

Run:
```bash
npm run dev
```

Expected: Server starts at http://localhost:5173

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize SvelteKit project"
```

### Task 2: Configure Static Adapter

**Files:**
- Modify: `svelte.config.js`
- Modify: `package.json`

- [ ] **Step 1: Install static adapter**

Run:
```bash
npm install -D @sveltejs/adapter-static
```

- [ ] **Step 2: Configure adapter**

Replace `svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
```

- [ ] **Step 3: Add prerender to root layout**

Create `src/routes/+layout.js`:
```javascript
export const prerender = true;
```

- [ ] **Step 4: Verify build works**

Run:
```bash
npm run build
```

Expected: Build succeeds, output in `build/`

- [ ] **Step 5: Commit**

```bash
git add svelte.config.js src/routes/+layout.js package.json package-lock.json
git commit -m "chore: configure static adapter"
```

### Task 3: Set Up Tailwind CSS with Dark Theme

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/app.css`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Install Tailwind**

Run:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Tailwind**

Replace `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				dark: {
					bg: '#0f1419',
					surface: '#1a1f2e',
					border: '#2d3748',
					text: '#e2e8f0',
					muted: '#718096'
				}
			}
		}
	},
	plugins: []
};
```

- [ ] **Step 3: Create global styles**

Create `src/app.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
	color-scheme: dark;
}

body {
	@apply bg-dark-bg text-dark-text min-h-screen;
}

/* Data table styles */
.data-table {
	@apply w-full border-collapse;
}

.data-table th {
	@apply text-left p-3 bg-dark-surface border-b border-dark-border text-dark-muted uppercase text-xs tracking-wider cursor-pointer hover:text-dark-text;
}

.data-table td {
	@apply p-3 border-b border-dark-border;
}

.data-table tr:hover {
	@apply bg-dark-surface;
}

/* Card styles */
.card {
	@apply bg-dark-surface border border-dark-border rounded-lg p-4;
}

/* Button styles */
.btn {
	@apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn-primary {
	@apply bg-blue-600 hover:bg-blue-700 text-white;
}

/* Tab styles */
.tab {
	@apply px-4 py-2 rounded-t-lg cursor-pointer transition-colors;
}

.tab-active {
	@apply bg-dark-surface text-dark-text border-b-2 border-blue-500;
}

.tab-inactive {
	@apply text-dark-muted hover:text-dark-text;
}
```

- [ ] **Step 4: Import styles in layout**

Create `src/routes/+layout.svelte`:
```svelte
<script>
	import '../app.css';
</script>

<div class="min-h-screen">
	<slot />
</div>
```

- [ ] **Step 5: Verify Tailwind works**

Replace `src/routes/+page.svelte`:
```svelte
<main class="p-8">
	<h1 class="text-3xl font-bold text-dark-text">FRC District Navigator</h1>
	<p class="text-dark-muted mt-2">Setup complete</p>
</main>
```

Run:
```bash
npm run dev
```

Expected: Dark themed page with styled heading

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js postcss.config.js src/app.css src/routes/+layout.svelte src/routes/+page.svelte
git commit -m "chore: set up Tailwind CSS with dark theme"
```

### Task 4: Set Up Testing Infrastructure

**Files:**
- Create: `vitest.config.js`
- Create: `tests/lib/analysis.test.js`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest @testing-library/svelte jsdom
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.js`:
```javascript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		include: ['tests/**/*.test.{js,ts}'],
		environment: 'jsdom',
		globals: true
	}
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `package.json` scripts:
```json
{
	"scripts": {
		"test": "vitest",
		"test:run": "vitest run"
	}
}
```

- [ ] **Step 4: Create placeholder test**

Create `tests/lib/analysis.test.js`:
```javascript
import { describe, it, expect } from 'vitest';

describe('analysis', () => {
	it('placeholder test passes', () => {
		expect(true).toBe(true);
	});
});
```

- [ ] **Step 5: Verify tests run**

Run:
```bash
npm run test:run
```

Expected: 1 test passes

- [ ] **Step 6: Commit**

```bash
git add vitest.config.js tests/ package.json package-lock.json
git commit -m "chore: set up Vitest testing infrastructure"
```

---

## Chunk 2: Data Infrastructure

### Task 5: Create Sample Data Structure

**Files:**
- Create: `static/data/districts.json`
- Create: `static/data/fim/2024.json`

- [ ] **Step 1: Create districts index**

Create `static/data/districts.json`:
```json
{
	"districts": [
		{
			"key": "fim",
			"name": "Michigan",
			"years": [2024, 2023, 2022, 2021, 2020, 2019]
		},
		{
			"key": "ne",
			"name": "New England",
			"years": [2024, 2023, 2022, 2021, 2020, 2019]
		},
		{
			"key": "ont",
			"name": "Ontario",
			"years": [2024, 2023, 2022, 2021, 2020, 2019]
		}
	]
}
```

- [ ] **Step 2: Create sample district/year data**

Create `static/data/fim/2024.json`:
```json
{
	"district": "fim",
	"year": 2024,
	"events": [
		{
			"key": "2024miket",
			"name": "Kettering District",
			"startDate": "2024-03-01",
			"teams": [27, 33, 67, 469, 503, 1023]
		},
		{
			"key": "2024mimil",
			"name": "Milford District",
			"startDate": "2024-03-08",
			"teams": [27, 33, 469, 1023, 2054, 2137]
		},
		{
			"key": "2024mitry",
			"name": "Troy District",
			"startDate": "2024-03-15",
			"teams": [67, 503, 2054, 2137, 2767, 3096]
		}
	],
	"teams": {
		"27": { "name": "Team RUSH", "rookie_year": 1997 },
		"33": { "name": "Killer Bees", "rookie_year": 1998 },
		"67": { "name": "The HOT Team", "rookie_year": 1999 },
		"469": { "name": "Las Guerrillas", "rookie_year": 2000 },
		"503": { "name": "Frog Force", "rookie_year": 2001 },
		"1023": { "name": "FIRST Aggies", "rookie_year": 2003 },
		"2054": { "name": "Tech Vikings", "rookie_year": 2007 },
		"2137": { "name": "TORC", "rookie_year": 2007 },
		"2767": { "name": "Stryke Force", "rookie_year": 2009 },
		"3096": { "name": "RoboChargers", "rookie_year": 2010 }
	},
	"championship": {
		"key": "2024micmp",
		"name": "Michigan State Championship",
		"startDate": "2024-04-10",
		"rankings": [
			{ "team": 27, "rank": 1, "record": "10-2-0", "playoff": "Winner", "advancedToWorlds": true },
			{ "team": 33, "rank": 2, "record": "9-3-0", "playoff": "Finals", "advancedToWorlds": true },
			{ "team": 67, "rank": 5, "record": "8-4-0", "playoff": "Semis", "advancedToWorlds": false },
			{ "team": 469, "rank": 12, "record": "7-5-0", "playoff": "Quarters", "advancedToWorlds": false },
			{ "team": 503, "rank": 18, "record": "6-6-0", "playoff": null, "advancedToWorlds": false },
			{ "team": 1023, "rank": 24, "record": "5-7-0", "playoff": null, "advancedToWorlds": false }
		]
	}
}
```

- [ ] **Step 3: Commit**

```bash
git add static/data/
git commit -m "feat: add sample data structure"
```

### Task 6: Create Data Loading Utilities

**Files:**
- Create: `src/lib/data.js`
- Create: `tests/lib/data.test.js`

- [ ] **Step 1: Write failing test for loadDistricts**

Replace `tests/lib/data.test.js`:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadDistricts, loadDistrictYear } from '$lib/data.js';

// Mock fetch
global.fetch = vi.fn();

describe('loadDistricts', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns districts array from JSON', async () => {
		const mockData = {
			districts: [
				{ key: 'fim', name: 'Michigan', years: [2024] }
			]
		};
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData)
		});

		const result = await loadDistricts();

		expect(result).toEqual(mockData.districts);
		expect(global.fetch).toHaveBeenCalledWith('/data/districts.json');
	});
});

describe('loadDistrictYear', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns district year data from JSON', async () => {
		const mockData = {
			district: 'fim',
			year: 2024,
			events: [],
			teams: {},
			championship: null
		};
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData)
		});

		const result = await loadDistrictYear('fim', 2024);

		expect(result).toEqual(mockData);
		expect(global.fetch).toHaveBeenCalledWith('/data/fim/2024.json');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run
```

Expected: FAIL - Cannot find module '$lib/data.js'

- [ ] **Step 3: Implement data loading utilities**

Create `src/lib/data.js`:
```javascript
/**
 * Load the districts index
 * @returns {Promise<Array<{key: string, name: string, years: number[]}>>}
 */
export async function loadDistricts() {
	const response = await fetch('/data/districts.json');
	const data = await response.json();
	return data.districts;
}

/**
 * Load data for a specific district and year
 * @param {string} district - District key (e.g., 'fim')
 * @param {number} year - Year (e.g., 2024)
 * @returns {Promise<Object>}
 */
export async function loadDistrictYear(district, year) {
	const response = await fetch(`/data/${district}/${year}.json`);
	const data = await response.json();
	return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/data.js tests/lib/data.test.js
git commit -m "feat: add data loading utilities"
```

### Task 7: Create Analysis Functions

**Files:**
- Create: `src/lib/analysis.js`
- Modify: `tests/lib/analysis.test.js`

- [ ] **Step 1: Write failing test for findEventTwins**

Replace `tests/lib/analysis.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { findEventTwins, getAllEventPairings, getTeamChampionshipHistory } from '$lib/analysis.js';

const sampleData = {
	events: [
		{ key: 'event1', name: 'Event 1', teams: [1, 2, 3, 4] },
		{ key: 'event2', name: 'Event 2', teams: [1, 2, 5, 6] },
		{ key: 'event3', name: 'Event 3', teams: [3, 4, 5, 6] }
	],
	teams: {
		'1': { name: 'Team 1' },
		'2': { name: 'Team 2' },
		'3': { name: 'Team 3' },
		'4': { name: 'Team 4' },
		'5': { name: 'Team 5' },
		'6': { name: 'Team 6' }
	},
	championship: {
		rankings: [
			{ team: 1, rank: 1 },
			{ team: 2, rank: 2 }
		]
	}
};

describe('findEventTwins', () => {
	it('finds teams that share both events with given team', () => {
		const result = findEventTwins(sampleData, 1);

		expect(result.team).toBe(1);
		expect(result.events).toHaveLength(2);
		expect(result.events.map(e => e.key)).toContain('event1');
		expect(result.events.map(e => e.key)).toContain('event2');
		expect(result.twins).toContain(2);
		expect(result.twins).not.toContain(3);
	});

	it('returns empty twins for team with no shared partners', () => {
		const dataWithLoner = {
			...sampleData,
			events: [
				{ key: 'event1', name: 'Event 1', teams: [1, 2, 3] },
				{ key: 'event2', name: 'Event 2', teams: [1, 4, 5] }
			]
		};

		const result = findEventTwins(dataWithLoner, 1);

		expect(result.twins).toHaveLength(0);
	});
});

describe('getAllEventPairings', () => {
	it('returns all unique event pairings with team counts', () => {
		const result = getAllEventPairings(sampleData);

		expect(result).toBeInstanceOf(Array);
		expect(result.length).toBeGreaterThan(0);

		const event1And2 = result.find(
			p => p.events.includes('event1') && p.events.includes('event2')
		);
		expect(event1And2).toBeDefined();
		expect(event1And2.teams).toContain(1);
		expect(event1And2.teams).toContain(2);
	});
});

describe('getTeamChampionshipHistory', () => {
	it('returns championship rank for team', () => {
		const result = getTeamChampionshipHistory(sampleData, 1);

		expect(result.rank).toBe(1);
	});

	it('returns null for team not in championship', () => {
		const result = getTeamChampionshipHistory(sampleData, 99);

		expect(result).toBeNull();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run
```

Expected: FAIL - Cannot find module '$lib/analysis.js'

- [ ] **Step 3: Implement analysis functions**

Create `src/lib/analysis.js`:
```javascript
/**
 * Find teams that attended the same two events as a given team
 * @param {Object} districtData - District year data
 * @param {number} teamNumber - Team to find twins for
 * @returns {{team: number, events: Array, twins: number[]}}
 */
export function findEventTwins(districtData, teamNumber) {
	// Find events this team attended
	const teamEvents = districtData.events.filter(event =>
		event.teams.includes(teamNumber)
	);

	if (teamEvents.length < 2) {
		return { team: teamNumber, events: teamEvents, twins: [] };
	}

	// Find teams that attended ALL the same events
	const twins = [];
	const teamEventKeys = new Set(teamEvents.map(e => e.key));

	// Get all teams from team's events
	const candidateTeams = new Set();
	teamEvents.forEach(event => {
		event.teams.forEach(t => candidateTeams.add(t));
	});

	// Check each candidate
	candidateTeams.forEach(candidate => {
		if (candidate === teamNumber) return;

		const candidateEvents = districtData.events.filter(event =>
			event.teams.includes(candidate)
		);
		const candidateEventKeys = new Set(candidateEvents.map(e => e.key));

		// Check if candidate attended exactly the same events
		const sameEvents = teamEvents.every(e => candidateEventKeys.has(e.key));
		if (sameEvents) {
			twins.push(candidate);
		}
	});

	return { team: teamNumber, events: teamEvents, twins };
}

/**
 * Get all unique event pairings and which teams share them
 * @param {Object} districtData - District year data
 * @returns {Array<{events: string[], eventNames: string[], teams: number[]}>}
 */
export function getAllEventPairings(districtData) {
	// Build map of team -> events attended
	const teamEvents = new Map();

	districtData.events.forEach(event => {
		event.teams.forEach(team => {
			if (!teamEvents.has(team)) {
				teamEvents.set(team, []);
			}
			teamEvents.get(team).push(event.key);
		});
	});

	// Group teams by their event pairing
	const pairingMap = new Map();

	teamEvents.forEach((events, team) => {
		if (events.length < 2) return;

		// Sort events to create consistent key
		const key = [...events].sort().join('|');

		if (!pairingMap.has(key)) {
			pairingMap.set(key, {
				events: [...events].sort(),
				teams: []
			});
		}
		pairingMap.get(key).teams.push(team);
	});

	// Convert to array and add event names
	const eventNameMap = new Map(
		districtData.events.map(e => [e.key, e.name])
	);

	return Array.from(pairingMap.values()).map(pairing => ({
		...pairing,
		eventNames: pairing.events.map(key => eventNameMap.get(key) || key)
	}));
}

/**
 * Get championship history for a team in the current year
 * @param {Object} districtData - District year data
 * @param {number} teamNumber - Team number
 * @returns {Object|null}
 */
export function getTeamChampionshipHistory(districtData, teamNumber) {
	if (!districtData.championship || !districtData.championship.rankings) {
		return null;
	}

	const ranking = districtData.championship.rankings.find(
		r => r.team === teamNumber
	);

	return ranking || null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysis.js tests/lib/analysis.test.js
git commit -m "feat: add event twins and championship analysis functions"
```

---

## Chunk 3: Core Pages

### Task 8: Create Home Page

**Files:**
- Modify: `src/routes/+page.svelte`
- Create: `src/routes/+page.js`

- [ ] **Step 1: Create page load function**

Create `src/routes/+page.js`:
```javascript
import { loadDistricts } from '$lib/data.js';

export async function load({ fetch }) {
	const districts = await loadDistricts();

	// Get the most recent year across all districts
	const allYears = districts.flatMap(d => d.years);
	const latestYear = Math.max(...allYears);

	return {
		districts,
		latestYear
	};
}
```

- [ ] **Step 2: Implement home page UI**

Replace `src/routes/+page.svelte`:
```svelte
<script>
	export let data;

	let selectedDistrict = null;
	let selectedYear = data.latestYear;

	$: availableYears = selectedDistrict
		? data.districts.find(d => d.key === selectedDistrict)?.years || []
		: [...new Set(data.districts.flatMap(d => d.years))].sort((a, b) => b - a);
</script>

<svelte:head>
	<title>FRC District Navigator</title>
</svelte:head>

<main class="max-w-4xl mx-auto p-8">
	<h1 class="text-4xl font-bold mb-2">FRC District Navigator</h1>
	<p class="text-dark-muted mb-8">Explore FRC district history, event patterns, and championship streaks</p>

	<div class="card mb-6">
		<h2 class="text-xl font-semibold mb-4">Select a District</h2>
		<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
			{#each data.districts as district}
				<button
					class="p-3 rounded-lg border text-left transition-colors {selectedDistrict === district.key
						? 'bg-blue-600 border-blue-500 text-white'
						: 'border-dark-border hover:border-blue-500'}"
					on:click={() => {
						selectedDistrict = district.key;
						if (!district.years.includes(selectedYear)) {
							selectedYear = district.years[0];
						}
					}}
				>
					<div class="font-medium">{district.name}</div>
					<div class="text-sm opacity-70">{district.key.toUpperCase()}</div>
				</button>
			{/each}
		</div>
	</div>

	<div class="card mb-6">
		<h2 class="text-xl font-semibold mb-4">Select Year</h2>
		<select
			bind:value={selectedYear}
			class="w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text"
		>
			{#each availableYears as year}
				<option value={year}>{year}</option>
			{/each}
		</select>
	</div>

	{#if selectedDistrict && selectedYear}
		<a
			href="/{selectedDistrict}/{selectedYear}"
			class="btn btn-primary inline-block text-center w-full md:w-auto"
		>
			Explore {data.districts.find(d => d.key === selectedDistrict)?.name} {selectedYear} →
		</a>
	{:else}
		<button class="btn btn-primary opacity-50 cursor-not-allowed w-full md:w-auto" disabled>
			Select a district to continue
		</button>
	{/if}
</main>
```

- [ ] **Step 3: Verify page loads**

Run:
```bash
npm run dev
```

Expected: Home page shows district cards, year selector, and explore button

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte src/routes/+page.js
git commit -m "feat: implement home page with district/year selection"
```

### Task 9: Create District Layout and Overview

**Files:**
- Create: `src/routes/[district]/[year]/+layout.svelte`
- Create: `src/routes/[district]/[year]/+layout.js`
- Create: `src/routes/[district]/[year]/+page.svelte`

- [ ] **Step 1: Create district data loader**

Create `src/routes/[district]/[year]/+layout.js`:
```javascript
import { loadDistrictYear, loadDistricts } from '$lib/data.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { district, year } = params;
	const yearNum = parseInt(year, 10);

	try {
		const [districtData, districts] = await Promise.all([
			loadDistrictYear(district, yearNum),
			loadDistricts()
		]);

		const districtInfo = districts.find(d => d.key === district);

		return {
			districtData,
			districtInfo,
			district,
			year: yearNum,
			availableYears: districtInfo?.years || []
		};
	} catch (e) {
		throw error(404, `District ${district} ${year} not found`);
	}
}
```

- [ ] **Step 2: Create district layout with navigation**

Create `src/routes/[district]/[year]/+layout.svelte`:
```svelte
<script>
	import { page } from '$app/stores';

	export let data;

	$: currentPath = $page.url.pathname;
	$: basePath = `/${data.district}/${data.year}`;
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="bg-dark-surface border-b border-dark-border">
		<div class="max-w-6xl mx-auto px-4 py-4">
			<!-- Breadcrumb -->
			<nav class="text-sm text-dark-muted mb-2">
				<a href="/" class="hover:text-dark-text">Home</a>
				<span class="mx-2">→</span>
				<span class="text-dark-text">{data.districtInfo?.name || data.district} {data.year}</span>
			</nav>

			<!-- Title and year toggle -->
			<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<h1 class="text-2xl font-bold">
					{data.districtInfo?.name || data.district} {data.year}
				</h1>

				<div class="flex gap-1">
					{#each data.availableYears.slice(0, 5) as year}
						<a
							href="/{data.district}/{year}"
							class="px-3 py-1 rounded text-sm {year === data.year
								? 'bg-blue-600 text-white'
								: 'bg-dark-bg hover:bg-dark-border text-dark-muted'}"
						>
							{year}
						</a>
					{/each}
				</div>
			</div>

			<!-- Nav tabs -->
			<nav class="flex gap-4 mt-4">
				<a
					href={basePath}
					class="tab {currentPath === basePath ? 'tab-active' : 'tab-inactive'}"
				>
					Overview
				</a>
				<a
					href="{basePath}/event-twins"
					class="tab {currentPath.includes('event-twins') ? 'tab-active' : 'tab-inactive'}"
				>
					Event Twins
				</a>
				<a
					href="{basePath}/championships"
					class="tab {currentPath.includes('championships') ? 'tab-active' : 'tab-inactive'}"
				>
					Championships
				</a>
			</nav>
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-6xl mx-auto px-4 py-6">
		<slot />
	</main>
</div>
```

- [ ] **Step 3: Create district overview page**

Create `src/routes/[district]/[year]/+page.svelte`:
```svelte
<script>
	export let data;

	$: teamCount = Object.keys(data.districtData.teams || {}).length;
	$: eventCount = data.districtData.events?.length || 0;
	$: championship = data.districtData.championship;
</script>

<svelte:head>
	<title>{data.districtInfo?.name} {data.year} | FRC District Navigator</title>
</svelte:head>

<div class="grid gap-6">
	<!-- Summary cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="card">
			<div class="text-dark-muted text-sm uppercase tracking-wider">Teams</div>
			<div class="text-3xl font-bold">{teamCount}</div>
		</div>
		<div class="card">
			<div class="text-dark-muted text-sm uppercase tracking-wider">District Events</div>
			<div class="text-3xl font-bold">{eventCount}</div>
		</div>
		<div class="card">
			<div class="text-dark-muted text-sm uppercase tracking-wider">Championship</div>
			<div class="text-lg font-bold">{championship?.name || 'N/A'}</div>
		</div>
	</div>

	<!-- Events list -->
	<div class="card">
		<h2 class="text-xl font-semibold mb-4">District Events</h2>
		<div class="grid gap-2">
			{#each data.districtData.events || [] as event}
				<div class="flex justify-between items-center p-3 bg-dark-bg rounded-lg">
					<div>
						<div class="font-medium">{event.name}</div>
						<div class="text-sm text-dark-muted">{event.startDate}</div>
					</div>
					<div class="text-dark-muted">
						{event.teams.length} teams
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Analysis links -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<a href="/{data.district}/{data.year}/event-twins" class="card hover:border-blue-500 transition-colors">
			<h3 class="text-lg font-semibold mb-2">Event Twins</h3>
			<p class="text-dark-muted">Find teams that attended the same two district events</p>
		</a>
		<a href="/{data.district}/{data.year}/championships" class="card hover:border-blue-500 transition-colors">
			<h3 class="text-lg font-semibold mb-2">Championship History</h3>
			<p class="text-dark-muted">Explore qualification streaks, results, and Worlds advancement</p>
		</a>
	</div>
</div>
```

- [ ] **Step 4: Verify navigation works**

Run:
```bash
npm run dev
```

Navigate to http://localhost:5173, select Michigan 2024, click Explore

Expected: District overview page with events, team count, navigation tabs

- [ ] **Step 5: Commit**

```bash
git add src/routes/\[district\]/\[year\]/
git commit -m "feat: add district layout and overview page"
```

---

## Chunk 4: Analysis Pages

### Task 10: Create Event Twins Page

**Files:**
- Create: `src/routes/[district]/[year]/event-twins/+page.svelte`
- Create: `src/lib/components/DataTable.svelte`

- [ ] **Step 1: Create reusable DataTable component**

Create `src/lib/components/DataTable.svelte`:
```svelte
<script>
	export let data = [];
	export let columns = [];
	export let onRowClick = null;

	let sortColumn = null;
	let sortDirection = 'asc';

	function handleSort(column) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	$: sortedData = (() => {
		if (!sortColumn) return data;

		const col = columns.find(c => c.key === sortColumn);
		if (!col) return data;

		return [...data].sort((a, b) => {
			const aVal = col.getValue ? col.getValue(a) : a[col.key];
			const bVal = col.getValue ? col.getValue(b) : b[col.key];

			if (aVal === bVal) return 0;
			if (aVal === null || aVal === undefined) return 1;
			if (bVal === null || bVal === undefined) return -1;

			const comparison = aVal < bVal ? -1 : 1;
			return sortDirection === 'asc' ? comparison : -comparison;
		});
	})();
</script>

<div class="overflow-x-auto">
	<table class="data-table">
		<thead>
			<tr>
				{#each columns as column}
					<th
						on:click={() => column.sortable !== false && handleSort(column.key)}
						class="{column.sortable !== false ? 'cursor-pointer' : ''}"
					>
						{column.label}
						{#if sortColumn === column.key}
							<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedData as row}
				<tr
					class="{onRowClick ? 'cursor-pointer' : ''}"
					on:click={() => onRowClick && onRowClick(row)}
				>
					{#each columns as column}
						<td>
							{#if column.render}
								{@html column.render(row)}
							{:else if column.getValue}
								{column.getValue(row)}
							{:else}
								{row[column.key] ?? '-'}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if sortedData.length === 0}
	<p class="text-dark-muted text-center py-8">No data available</p>
{/if}
```

- [ ] **Step 2: Create event twins page**

Create `src/routes/[district]/[year]/event-twins/+page.svelte`:
```svelte
<script>
	import DataTable from '$lib/components/DataTable.svelte';
	import { findEventTwins, getAllEventPairings } from '$lib/analysis.js';

	export let data;

	let activeTab = 'combinations';
	let selectedTeam = null;
	let selectedPairing = null;

	$: teams = Object.entries(data.districtData.teams || {}).map(([num, info]) => ({
		number: parseInt(num, 10),
		...info
	})).sort((a, b) => a.number - b.number);

	$: allPairings = getAllEventPairings(data.districtData)
		.sort((a, b) => b.teams.length - a.teams.length);

	$: eventTwinsResult = selectedTeam
		? findEventTwins(data.districtData, selectedTeam)
		: null;

	$: twinsTableData = eventTwinsResult?.twins.map(teamNum => {
		const teamInfo = data.districtData.teams[teamNum] || {};
		const champRank = data.districtData.championship?.rankings?.find(r => r.team === teamNum);
		return {
			number: teamNum,
			name: teamInfo.name || `Team ${teamNum}`,
			champRank: champRank?.rank || null
		};
	}) || [];

	$: pairingTableData = selectedPairing?.teams.map(teamNum => {
		const teamInfo = data.districtData.teams[teamNum] || {};
		const champRank = data.districtData.championship?.rankings?.find(r => r.team === teamNum);
		return {
			number: teamNum,
			name: teamInfo.name || `Team ${teamNum}`,
			champRank: champRank?.rank || null
		};
	}) || [];

	const teamColumns = [
		{ key: 'number', label: 'Team', sortable: true },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'champRank', label: 'Champ Rank', sortable: true }
	];

	function selectTeamFromTable(row) {
		selectedTeam = row.number;
		activeTab = 'byteam';
	}
</script>

<svelte:head>
	<title>Event Twins | {data.districtInfo?.name} {data.year}</title>
</svelte:head>

<div>
	<!-- Tab toggle -->
	<div class="flex gap-2 mb-6">
		<button
			class="tab {activeTab === 'combinations' ? 'tab-active' : 'tab-inactive'}"
			on:click={() => activeTab = 'combinations'}
		>
			All Combinations
		</button>
		<button
			class="tab {activeTab === 'byteam' ? 'tab-active' : 'tab-inactive'}"
			on:click={() => activeTab = 'byteam'}
		>
			By Team
		</button>
	</div>

	{#if activeTab === 'combinations'}
		<!-- All Combinations View -->
		<div class="card">
			<h2 class="text-xl font-semibold mb-4">Event Pairings</h2>
			<p class="text-dark-muted mb-4">All unique combinations of 2 events and the teams that attended both</p>

			<div class="space-y-2">
				{#each allPairings as pairing}
					<button
						class="w-full p-4 bg-dark-bg rounded-lg text-left hover:bg-dark-border transition-colors
							{selectedPairing === pairing ? 'ring-2 ring-blue-500' : ''}"
						on:click={() => selectedPairing = selectedPairing === pairing ? null : pairing}
					>
						<div class="flex justify-between items-center">
							<div>
								<div class="font-medium">{pairing.eventNames.join(' + ')}</div>
							</div>
							<div class="text-dark-muted">
								{pairing.teams.length} teams
							</div>
						</div>
					</button>
				{/each}
			</div>

			{#if selectedPairing}
				<div class="mt-6">
					<h3 class="text-lg font-semibold mb-3">
						Teams at {selectedPairing.eventNames.join(' + ')}
					</h3>
					<DataTable
						data={pairingTableData}
						columns={teamColumns}
						onRowClick={selectTeamFromTable}
					/>
				</div>
			{/if}
		</div>

	{:else}
		<!-- By Team View -->
		<div class="card">
			<h2 class="text-xl font-semibold mb-4">Find Event Twins</h2>

			<div class="mb-6">
				<label for="team-select" class="block text-sm text-dark-muted mb-2">Select a team</label>
				<select
					id="team-select"
					bind:value={selectedTeam}
					class="w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text"
				>
					<option value={null}>Choose a team...</option>
					{#each teams as team}
						<option value={team.number}>{team.number} - {team.name}</option>
					{/each}
				</select>
			</div>

			{#if eventTwinsResult}
				<div class="mb-6 p-4 bg-dark-bg rounded-lg">
					<div class="text-dark-muted text-sm mb-2">Team {selectedTeam} attended:</div>
					<div class="flex flex-wrap gap-2">
						{#each eventTwinsResult.events as event}
							<span class="px-3 py-1 bg-dark-surface rounded-full text-sm">
								{event.name}
							</span>
						{/each}
					</div>
				</div>

				<h3 class="text-lg font-semibold mb-3">
					Event Twins ({twinsTableData.length})
				</h3>

				{#if twinsTableData.length > 0}
					<DataTable
						data={twinsTableData}
						columns={teamColumns}
						onRowClick={(row) => selectedTeam = row.number}
					/>
				{:else}
					<p class="text-dark-muted">No other teams attended both of these events.</p>
				{/if}
			{/if}
		</div>
	{/if}
</div>
```

- [ ] **Step 3: Verify event twins page works**

Run:
```bash
npm run dev
```

Navigate to Michigan 2024 → Event Twins

Expected: Tab toggle works, can view all combinations, can select team and see twins

- [ ] **Step 4: Commit**

```bash
git add src/routes/\[district\]/\[year\]/event-twins/ src/lib/components/DataTable.svelte
git commit -m "feat: add event twins analysis page"
```

### Task 11: Create Championships Page

**Files:**
- Create: `src/routes/[district]/[year]/championships/+page.svelte`

- [ ] **Step 1: Create championships page**

Create `src/routes/[district]/[year]/championships/+page.svelte`:
```svelte
<script>
	import DataTable from '$lib/components/DataTable.svelte';

	export let data;

	let activeTab = 'all';
	let selectedTeam = null;

	$: championship = data.districtData.championship;
	$: rankings = championship?.rankings || [];

	$: allTeamsData = rankings.map(r => {
		const teamInfo = data.districtData.teams[r.team] || {};
		return {
			number: r.team,
			name: teamInfo.name || `Team ${r.team}`,
			rank: r.rank,
			record: r.record,
			playoff: r.playoff || '-',
			worlds: r.advancedToWorlds ? 'Yes' : 'No'
		};
	});

	$: selectedTeamData = selectedTeam
		? rankings.find(r => r.team === selectedTeam)
		: null;

	$: selectedTeamInfo = selectedTeam
		? data.districtData.teams[selectedTeam] || {}
		: null;

	const columns = [
		{ key: 'rank', label: 'Rank', sortable: true },
		{ key: 'number', label: 'Team', sortable: true },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'record', label: 'Record', sortable: false },
		{ key: 'playoff', label: 'Playoff', sortable: true },
		{ key: 'worlds', label: 'Worlds', sortable: true }
	];

	$: teams = Object.entries(data.districtData.teams || {}).map(([num, info]) => ({
		number: parseInt(num, 10),
		...info
	})).sort((a, b) => a.number - b.number);
</script>

<svelte:head>
	<title>Championship History | {data.districtInfo?.name} {data.year}</title>
</svelte:head>

<div>
	{#if !championship}
		<div class="card">
			<p class="text-dark-muted">No championship data available for this district/year.</p>
		</div>
	{:else}
		<!-- Championship header -->
		<div class="card mb-6">
			<h2 class="text-xl font-semibold">{championship.name}</h2>
			<p class="text-dark-muted">{championship.startDate}</p>
		</div>

		<!-- Tab toggle -->
		<div class="flex gap-2 mb-6">
			<button
				class="tab {activeTab === 'all' ? 'tab-active' : 'tab-inactive'}"
				on:click={() => activeTab = 'all'}
			>
				All Teams
			</button>
			<button
				class="tab {activeTab === 'byteam' ? 'tab-active' : 'tab-inactive'}"
				on:click={() => activeTab = 'byteam'}
			>
				By Team
			</button>
		</div>

		{#if activeTab === 'all'}
			<!-- All Teams View -->
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">Championship Rankings</h3>
				<DataTable
					data={allTeamsData}
					columns={columns}
					onRowClick={(row) => {
						selectedTeam = row.number;
						activeTab = 'byteam';
					}}
				/>
			</div>

		{:else}
			<!-- By Team View -->
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">Team Championship Profile</h3>

				<div class="mb-6">
					<label for="team-select" class="block text-sm text-dark-muted mb-2">Select a team</label>
					<select
						id="team-select"
						bind:value={selectedTeam}
						class="w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text"
					>
						<option value={null}>Choose a team...</option>
						{#each teams as team}
							<option value={team.number}>{team.number} - {team.name}</option>
						{/each}
					</select>
				</div>

				{#if selectedTeamData}
					<div class="space-y-4">
						<!-- Team header -->
						<div class="p-4 bg-dark-bg rounded-lg">
							<h4 class="text-xl font-bold">
								Team {selectedTeam} - {selectedTeamInfo?.name || 'Unknown'}
							</h4>
							{#if selectedTeamInfo?.rookie_year}
								<p class="text-dark-muted">Rookie Year: {selectedTeamInfo.rookie_year}</p>
							{/if}
						</div>

						<!-- Stats grid -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-3xl font-bold">{selectedTeamData.rank}</div>
								<div class="text-dark-muted text-sm">Rank</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-xl font-bold">{selectedTeamData.record}</div>
								<div class="text-dark-muted text-sm">Record</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-xl font-bold">{selectedTeamData.playoff || '-'}</div>
								<div class="text-dark-muted text-sm">Playoff</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-xl font-bold {selectedTeamData.advancedToWorlds ? 'text-green-400' : ''}">
									{selectedTeamData.advancedToWorlds ? 'Yes' : 'No'}
								</div>
								<div class="text-dark-muted text-sm">Worlds</div>
							</div>
						</div>

						<!-- Note about multi-year history -->
						<div class="p-4 bg-dark-surface border border-dark-border rounded-lg">
							<p class="text-dark-muted text-sm">
								Note: Multi-year championship history (streaks, historical results) will be available
								once data is loaded for multiple years. Currently showing {data.year} only.
							</p>
						</div>
					</div>
				{:else if selectedTeam}
					<p class="text-dark-muted">Team {selectedTeam} did not qualify for the championship.</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>
```

- [ ] **Step 2: Verify championships page works**

Run:
```bash
npm run dev
```

Navigate to Michigan 2024 → Championships

Expected: Rankings table with sorting, team detail view with stats

- [ ] **Step 3: Commit**

```bash
git add src/routes/\[district\]/\[year\]/championships/
git commit -m "feat: add championship history page"
```

---

## Chunk 5: Data Fetch Script

### Task 12: Create TBA Data Fetch Script

**Files:**
- Create: `scripts/fetch-tba-data.js`
- Modify: `package.json`

- [ ] **Step 1: Create fetch script**

Create `scripts/fetch-tba-data.js`:
```javascript
/**
 * Fetch FRC district data from The Blue Alliance API
 *
 * Usage: TBA_API_KEY=your_key node scripts/fetch-tba-data.js
 *
 * Requires a TBA API key from https://www.thebluealliance.com/account
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'static', 'data');

const TBA_API_KEY = process.env.TBA_API_KEY;
const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3';

if (!TBA_API_KEY) {
	console.error('Error: TBA_API_KEY environment variable is required');
	console.error('Get your key at: https://www.thebluealliance.com/account');
	process.exit(1);
}

async function fetchTBA(endpoint) {
	const response = await fetch(`${TBA_BASE_URL}${endpoint}`, {
		headers: {
			'X-TBA-Auth-Key': TBA_API_KEY
		}
	});

	if (!response.ok) {
		throw new Error(`TBA API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

async function fetchDistrictYearData(districtKey, year) {
	console.log(`  Fetching ${districtKey} ${year}...`);

	// Fetch events in this district
	const events = await fetchTBA(`/district/${year}${districtKey}/events`);

	// Fetch teams in this district
	const districtTeams = await fetchTBA(`/district/${year}${districtKey}/teams`);

	// Build teams map
	const teams = {};
	for (const team of districtTeams) {
		teams[team.team_number] = {
			name: team.nickname || team.name,
			rookie_year: team.rookie_year
		};
	}

	// Fetch team lists for each event
	const eventData = [];
	let championship = null;

	for (const event of events) {
		const eventTeams = await fetchTBA(`/event/${event.key}/teams/keys`);
		const teamNumbers = eventTeams.map(k => parseInt(k.replace('frc', ''), 10));

		const eventEntry = {
			key: event.key,
			name: event.name,
			startDate: event.start_date,
			teams: teamNumbers
		};

		// Check if this is the district championship
		if (event.event_type === 2) { // District Championship
			// Fetch rankings
			const rankings = await fetchTBA(`/event/${event.key}/district_points`);
			const eventRankings = await fetchTBA(`/event/${event.key}/rankings`);

			championship = {
				key: event.key,
				name: event.name,
				startDate: event.start_date,
				rankings: eventRankings?.rankings?.map(r => ({
					team: parseInt(r.team_key.replace('frc', ''), 10),
					rank: r.rank,
					record: `${r.record.wins}-${r.record.losses}-${r.record.ties}`,
					playoff: null, // Would need alliance/playoff data
					advancedToWorlds: false // Would need to check worlds qualification
				})) || []
			};
		} else {
			eventData.push(eventEntry);
		}
	}

	return {
		district: districtKey,
		year,
		events: eventData,
		teams,
		championship
	};
}

async function main() {
	console.log('Fetching FRC district data from The Blue Alliance...\n');

	// Create data directory
	await fs.mkdir(DATA_DIR, { recursive: true });

	// Fetch list of districts
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let y = 2009; y <= currentYear; y++) {
		years.push(y);
	}

	const allDistricts = new Map();

	// Collect all districts across years
	for (const year of years) {
		try {
			const districts = await fetchTBA(`/districts/${year}`);
			for (const d of districts) {
				const key = d.abbreviation.toLowerCase();
				if (!allDistricts.has(key)) {
					allDistricts.set(key, {
						key,
						name: d.display_name,
						years: []
					});
				}
				allDistricts.get(key).years.push(year);
			}
		} catch (e) {
			console.log(`  No districts for ${year}`);
		}
	}

	// Write districts index
	const districtsData = {
		districts: Array.from(allDistricts.values()).map(d => ({
			...d,
			years: d.years.sort((a, b) => b - a)
		}))
	};

	await fs.writeFile(
		path.join(DATA_DIR, 'districts.json'),
		JSON.stringify(districtsData, null, 2)
	);
	console.log('Wrote districts.json\n');

	// Fetch data for each district/year
	for (const [districtKey, district] of allDistricts) {
		console.log(`\nFetching ${district.name}...`);

		const districtDir = path.join(DATA_DIR, districtKey);
		await fs.mkdir(districtDir, { recursive: true });

		for (const year of district.years) {
			try {
				const data = await fetchDistrictYearData(districtKey, year);
				await fs.writeFile(
					path.join(districtDir, `${year}.json`),
					JSON.stringify(data, null, 2)
				);
			} catch (e) {
				console.error(`  Error fetching ${districtKey} ${year}: ${e.message}`);
			}

			// Rate limiting - TBA allows 100 requests per second
			await new Promise(r => setTimeout(r, 100));
		}
	}

	console.log('\nDone! Data saved to static/data/');
}

main().catch(console.error);
```

- [ ] **Step 2: Add script to package.json**

Add to `package.json` scripts:
```json
{
	"scripts": {
		"fetch-data": "node scripts/fetch-tba-data.js"
	}
}
```

- [ ] **Step 3: Add .gitignore for large data files (optional)**

Add to `.gitignore`:
```
# Optionally ignore fetched data if too large
# static/data/
```

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-tba-data.js package.json
git commit -m "feat: add TBA data fetch script"
```

---

## Chunk 6: Final Setup

### Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md with project info**

Replace `CLAUDE.md`:
```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with project documentation"
```

### Task 14: Final Build Verification

- [ ] **Step 1: Run full test suite**

Run:
```bash
npm run test:run
```

Expected: All tests pass

- [ ] **Step 2: Build for production**

Run:
```bash
npm run build
```

Expected: Build succeeds, output in `build/`

- [ ] **Step 3: Preview production build**

Run:
```bash
npm run preview
```

Expected: App works at http://localhost:4173

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: complete initial implementation"
```

---

## Summary

**Total Tasks:** 14
**Estimated Commits:** 14+

**What's Built:**
- SvelteKit static site with dark theme
- Home page with district/year selection
- District overview with event listings
- Event Twins analysis (all combinations + by team)
- Championship History (all teams + by team detail)
- Reusable DataTable component
- TBA data fetch script
- Full test infrastructure

**Next Steps After Implementation:**
1. Run `TBA_API_KEY=xxx npm run fetch-data` to populate real data
2. Deploy to GitHub Pages or Vercel
3. Add more analysis pages as desired
