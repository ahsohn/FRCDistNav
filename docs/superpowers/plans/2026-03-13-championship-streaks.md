# Championship Streaks Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a championship streaks page showing consecutive District Championship qualifying streaks for all teams in a district.

**Architecture:** Client-side multi-year data loading with streak calculation in a dedicated module. Two-tab UI matching existing championships page pattern.

**Tech Stack:** SvelteKit, Tailwind CSS (dark theme), Vitest for testing

**Spec:** `docs/superpowers/specs/2026-03-13-championship-streaks-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/streaks.js` | Pure functions for streak calculation |
| `tests/lib/streaks.test.js` | Unit tests for streak calculation |
| `src/lib/data.js` | Add `loadAllDistrictYears()` helper |
| `src/routes/[district]/[year]/championship-streaks/+page.svelte` | Main page component |
| `src/routes/[district]/[year]/+layout.svelte` | Add nav tab |
| `src/routes/[district]/[year]/+page.svelte` | Add analysis link card |

---

## Chunk 1: Streak Calculation Module

### Task 1: Create streak calculation module with tests

**Files:**
- Create: `src/lib/streaks.js`
- Create: `tests/lib/streaks.test.js`

- [ ] **Step 1.1: Create test file with first test case**

```javascript
// tests/lib/streaks.test.js
import { describe, it, expect } from 'vitest';
import { extractChampionshipTeams } from './streaks.js';

describe('extractChampionshipTeams', () => {
	it('extracts teams from championship events (keys containing cmp)', () => {
		const yearData = {
			year: 2023,
			events: [
				{ key: '2023miev1', name: 'Event 1', teams: [1, 2, 3] },
				{ key: '2023micmp1', name: 'Champ Div 1', teams: [10, 20, 30] },
				{ key: '2023micmp2', name: 'Champ Div 2', teams: [40, 50] }
			]
		};

		const result = extractChampionshipTeams(yearData);
		expect(result).toEqual(new Set([10, 20, 30, 40, 50]));
	});
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/streaks.test.js`
Expected: FAIL - module not found

- [ ] **Step 1.3: Write minimal implementation**

```javascript
// src/lib/streaks.js
/**
 * Extract teams that participated in championship events
 * @param {Object} yearData - Single year district data
 * @returns {Set<number>} Set of team numbers
 */
export function extractChampionshipTeams(yearData) {
	const teams = new Set();
	for (const event of yearData.events || []) {
		if (event.key.includes('cmp')) {
			for (const team of event.teams) {
				teams.add(team);
			}
		}
	}
	return teams;
}
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `npm run test:run -- tests/lib/streaks.test.js`
Expected: PASS

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/streaks.js tests/lib/streaks.test.js
git commit -m "feat(streaks): add extractChampionshipTeams function"
```

---

### Task 2: Add buildQualificationHistory function

**Files:**
- Modify: `src/lib/streaks.js`
- Modify: `tests/lib/streaks.test.js`

- [ ] **Step 2.1: Add test for buildQualificationHistory**

```javascript
// Add to tests/lib/streaks.test.js
import { extractChampionshipTeams, buildQualificationHistory } from './streaks.js';

describe('buildQualificationHistory', () => {
	it('builds map of team to years they qualified', () => {
		const allYearsData = [
			{
				year: 2022,
				events: [
					{ key: '2022micmp1', teams: [1, 2] }
				]
			},
			{
				year: 2023,
				events: [
					{ key: '2023micmp1', teams: [1, 3] }
				]
			}
		];

		const result = buildQualificationHistory(allYearsData);

		expect(result.get(1)).toEqual(new Set([2022, 2023]));
		expect(result.get(2)).toEqual(new Set([2022]));
		expect(result.get(3)).toEqual(new Set([2023]));
	});
});
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/streaks.test.js`
Expected: FAIL - buildQualificationHistory not exported

- [ ] **Step 2.3: Write implementation**

```javascript
// Add to src/lib/streaks.js
/**
 * Build qualification history for all teams across years
 * @param {Array<Object>} allYearsData - Array of year data objects
 * @returns {Map<number, Set<number>>} Map of team -> Set of years qualified
 */
export function buildQualificationHistory(allYearsData) {
	const history = new Map();

	for (const yearData of allYearsData) {
		const qualifiedTeams = extractChampionshipTeams(yearData);
		for (const team of qualifiedTeams) {
			if (!history.has(team)) {
				history.set(team, new Set());
			}
			history.get(team).add(yearData.year);
		}
	}

	return history;
}
```

- [ ] **Step 2.4: Run test to verify it passes**

Run: `npm run test:run -- tests/lib/streaks.test.js`
Expected: PASS

- [ ] **Step 2.5: Commit**

```bash
git add src/lib/streaks.js tests/lib/streaks.test.js
git commit -m "feat(streaks): add buildQualificationHistory function"
```

---

### Task 3: Add calculateStreak function

**Files:**
- Modify: `src/lib/streaks.js`
- Modify: `tests/lib/streaks.test.js`

- [ ] **Step 3.1: Add tests for calculateStreak**

```javascript
// Add to tests/lib/streaks.test.js
import { extractChampionshipTeams, buildQualificationHistory, calculateStreak } from './streaks.js';

describe('calculateStreak', () => {
	const availableYears = [2020, 2021, 2022, 2023, 2024];

	it('calculates active streak when team qualified in latest year', () => {
		const qualifiedYears = new Set([2022, 2023, 2024]);
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 3,
			start: 2022,
			end: 2024,
			isActive: true
		});
	});

	it('calculates ended streak when team did not qualify in latest year', () => {
		const qualifiedYears = new Set([2021, 2022, 2023]);
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 3,
			start: 2021,
			end: 2023,
			isActive: false
		});
	});

	it('handles team with no qualifications', () => {
		const qualifiedYears = new Set();
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 0,
			start: null,
			end: null,
			isActive: false
		});
	});

	it('handles single year qualification', () => {
		const qualifiedYears = new Set([2022]);
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 1,
			start: 2022,
			end: 2022,
			isActive: false
		});
	});

	it('finds most recent streak when there are gaps', () => {
		const qualifiedYears = new Set([2020, 2023, 2024]);
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 2,
			start: 2023,
			end: 2024,
			isActive: true
		});
	});
});
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/streaks.test.js`
Expected: FAIL - calculateStreak not exported

- [ ] **Step 3.3: Write implementation**

```javascript
// Add to src/lib/streaks.js
/**
 * Calculate the current/most recent streak for a team
 * @param {Set<number>} qualifiedYears - Years the team qualified
 * @param {Array<number>} availableYears - All years in district (sorted ascending)
 * @returns {{length: number, start: number|null, end: number|null, isActive: boolean}}
 */
export function calculateStreak(qualifiedYears, availableYears) {
	if (qualifiedYears.size === 0) {
		return { length: 0, start: null, end: null, isActive: false };
	}

	const sortedYears = [...availableYears].sort((a, b) => b - a); // descending
	const latestYear = sortedYears[0];

	// Find the most recent year team qualified
	let mostRecentQualYear = null;
	for (const year of sortedYears) {
		if (qualifiedYears.has(year)) {
			mostRecentQualYear = year;
			break;
		}
	}

	if (mostRecentQualYear === null) {
		return { length: 0, start: null, end: null, isActive: false };
	}

	// Count consecutive years backwards from most recent qualification
	let streakLength = 1;
	let streakStart = mostRecentQualYear;

	const sortedAsc = [...availableYears].sort((a, b) => a - b);
	const mostRecentIdx = sortedAsc.indexOf(mostRecentQualYear);

	for (let i = mostRecentIdx - 1; i >= 0; i--) {
		const prevYear = sortedAsc[i];
		if (qualifiedYears.has(prevYear)) {
			streakLength++;
			streakStart = prevYear;
		} else {
			break;
		}
	}

	return {
		length: streakLength,
		start: streakStart,
		end: mostRecentQualYear,
		isActive: mostRecentQualYear === latestYear
	};
}
```

- [ ] **Step 3.4: Run test to verify it passes**

Run: `npm run test:run -- tests/lib/streaks.test.js`
Expected: PASS

- [ ] **Step 3.5: Commit**

```bash
git add src/lib/streaks.js tests/lib/streaks.test.js
git commit -m "feat(streaks): add calculateStreak function"
```

---

### Task 4: Add calculateAllStreaks function

**Files:**
- Modify: `src/lib/streaks.js`
- Modify: `tests/lib/streaks.test.js`

- [ ] **Step 4.1: Add test for calculateAllStreaks**

```javascript
// Add to tests/lib/streaks.test.js
import {
	extractChampionshipTeams,
	buildQualificationHistory,
	calculateStreak,
	calculateAllStreaks
} from './streaks.js';

describe('calculateAllStreaks', () => {
	it('calculates streaks for all teams and sorts correctly', () => {
		const allYearsData = [
			{
				year: 2022,
				events: [{ key: '2022cmp', teams: [1, 2] }],
				teams: { 1: { name: 'Team One', rookie_year: 2010 }, 2: { name: 'Team Two', rookie_year: 2015 } }
			},
			{
				year: 2023,
				events: [{ key: '2023cmp', teams: [1] }],
				teams: { 1: { name: 'Team One', rookie_year: 2010 }, 3: { name: 'Team Three', rookie_year: 2020 } }
			}
		];
		const allTeams = {
			1: { name: 'Team One', rookie_year: 2010 },
			2: { name: 'Team Two', rookie_year: 2015 },
			3: { name: 'Team Three', rookie_year: 2020 }
		};
		const availableYears = [2022, 2023];

		const result = calculateAllStreaks(allYearsData, allTeams, availableYears);

		// Team 1: 2-year active streak (first)
		// Team 2: 1-year ended streak
		// Team 3: 0-year never qualified (last)
		expect(result[0].team).toBe(1);
		expect(result[0].currentStreak).toBe(2);
		expect(result[0].isActive).toBe(true);

		expect(result[1].team).toBe(2);
		expect(result[1].currentStreak).toBe(1);
		expect(result[1].isActive).toBe(false);

		expect(result[2].team).toBe(3);
		expect(result[2].currentStreak).toBe(0);
		expect(result[2].isActive).toBe(false);
	});
});
```

- [ ] **Step 4.2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/streaks.test.js`
Expected: FAIL - calculateAllStreaks not exported

- [ ] **Step 4.3: Write implementation**

```javascript
// Add to src/lib/streaks.js
/**
 * Calculate streaks for all teams in a district
 * @param {Array<Object>} allYearsData - Array of year data objects
 * @param {Object} allTeams - Map of team number to team info
 * @param {Array<number>} availableYears - All years in district
 * @returns {Array<Object>} Sorted array of team streak data
 */
export function calculateAllStreaks(allYearsData, allTeams, availableYears) {
	const qualificationHistory = buildQualificationHistory(allYearsData);
	const results = [];

	for (const [teamNum, teamInfo] of Object.entries(allTeams)) {
		const team = parseInt(teamNum, 10);
		const qualifiedYears = qualificationHistory.get(team) || new Set();
		const streak = calculateStreak(qualifiedYears, availableYears);

		results.push({
			team,
			name: teamInfo.name || `Team ${team}`,
			rookieYear: teamInfo.rookie_year || null,
			currentStreak: streak.length,
			streakStart: streak.start,
			streakEnd: streak.end,
			isActive: streak.isActive,
			totalQualifications: qualifiedYears.size,
			qualifiedYears: [...qualifiedYears].sort((a, b) => a - b)
		});
	}

	// Sort: active first, then by streak length descending, then by team number
	results.sort((a, b) => {
		if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
		if (a.currentStreak !== b.currentStreak) return b.currentStreak - a.currentStreak;
		return a.team - b.team;
	});

	return results;
}
```

- [ ] **Step 4.4: Run test to verify it passes**

Run: `npm run test:run -- tests/lib/streaks.test.js`
Expected: PASS

- [ ] **Step 4.5: Commit**

```bash
git add src/lib/streaks.js tests/lib/streaks.test.js
git commit -m "feat(streaks): add calculateAllStreaks function"
```

---

## Chunk 2: Data Loading Helper

### Task 5: Add loadAllDistrictYears to data.js

**Files:**
- Modify: `src/lib/data.js`

- [ ] **Step 5.1: Add loadAllDistrictYears function**

```javascript
// Add to src/lib/data.js

/**
 * Load data for all years of a district in parallel
 * @param {string} district - District key (e.g., 'fim')
 * @param {Array<number>} years - Array of years to load
 * @param {typeof fetch} [fetchFn] - Optional fetch function (for SSR)
 * @returns {Promise<Array<Object>>}
 */
export async function loadAllDistrictYears(district, years, fetchFn = fetch) {
	const promises = years.map(year =>
		loadDistrictYear(district, year, fetchFn).catch(() => null)
	);
	const results = await Promise.all(promises);
	return results.filter(r => r !== null);
}
```

- [ ] **Step 5.2: Run existing tests to ensure no regression**

Run: `npm run test:run`
Expected: All existing tests pass

- [ ] **Step 5.3: Commit**

```bash
git add src/lib/data.js
git commit -m "feat(data): add loadAllDistrictYears helper"
```

---

## Chunk 3: Championship Streaks Page

### Task 6: Create championship-streaks page structure

**Files:**
- Create: `src/routes/[district]/[year]/championship-streaks/+page.svelte`

- [ ] **Step 6.1: Create basic page with loading state**

```svelte
<script>
	import { onMount } from 'svelte';
	import { loadAllDistrictYears } from '$lib/data.js';
	import { calculateAllStreaks } from '$lib/streaks.js';
	import DataTable from '$lib/components/DataTable.svelte';

	export let data;

	let loading = true;
	let streaksData = [];
	let activeTab = 'all';
	let selectedTeam = null;

	$: districtInfo = data.districtInfo;
	$: currentYear = data.year;
	$: availableYears = districtInfo?.years || [];

	onMount(async () => {
		if (!districtInfo || availableYears.length === 0) {
			loading = false;
			return;
		}

		const allYearsData = await loadAllDistrictYears(
			data.district,
			availableYears
		);

		// Merge all teams from all years
		const allTeams = {};
		for (const yearData of allYearsData) {
			for (const [num, info] of Object.entries(yearData.teams || {})) {
				if (!allTeams[num]) {
					allTeams[num] = info;
				}
			}
		}

		streaksData = calculateAllStreaks(allYearsData, allTeams, availableYears);
		loading = false;
	});

	$: selectedTeamData = selectedTeam
		? streaksData.find(s => s.team === selectedTeam)
		: null;

	const columns = [
		{ key: 'team', label: 'Team', sortable: true },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'currentStreak', label: 'Streak', sortable: true },
		{ key: 'status', label: 'Status', sortable: true },
		{ key: 'streakStart', label: 'Since', sortable: true }
	];

	$: tableData = streaksData.map(s => ({
		...s,
		status: s.currentStreak === 0
			? 'Never'
			: s.isActive
				? 'Active'
				: `Ended ${s.streakEnd}`
	}));
</script>

<svelte:head>
	<title>Championship Streaks | {districtInfo?.name} {currentYear}</title>
</svelte:head>

<div>
	{#if loading}
		<div class="card">
			<p class="text-dark-muted">Loading {availableYears.length} years of data...</p>
		</div>
	{:else if streaksData.length === 0}
		<div class="card">
			<p class="text-dark-muted">No championship data available for this district.</p>
		</div>
	{:else}
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
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">Championship Qualifying Streaks</h3>
				<DataTable
					data={tableData}
					{columns}
					onRowClick={(row) => {
						selectedTeam = row.team;
						activeTab = 'byteam';
					}}
				/>
			</div>
		{:else}
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">Team Championship History</h3>

				<div class="mb-6">
					<label for="team-select" class="block text-sm text-dark-muted mb-2">Select a team</label>
					<select
						id="team-select"
						bind:value={selectedTeam}
						class="w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text"
					>
						<option value={null}>Choose a team...</option>
						{#each streaksData as team}
							<option value={team.team}>{team.team} - {team.name}</option>
						{/each}
					</select>
				</div>

				{#if selectedTeamData}
					<div class="space-y-4">
						<!-- Team header -->
						<div class="p-4 bg-dark-bg rounded-lg">
							<h4 class="text-xl font-bold">
								Team {selectedTeamData.team} - {selectedTeamData.name}
							</h4>
							{#if selectedTeamData.rookieYear}
								<p class="text-dark-muted">Rookie Year: {selectedTeamData.rookieYear}</p>
							{/if}
						</div>

						<!-- Stats grid -->
						<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-3xl font-bold">{selectedTeamData.currentStreak}</div>
								<div class="text-dark-muted text-sm">Current Streak</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-3xl font-bold">{selectedTeamData.totalQualifications}</div>
								<div class="text-dark-muted text-sm">Total Qualifications</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-xl font-bold {selectedTeamData.isActive ? 'text-green-400' : ''}">
									{selectedTeamData.isActive ? 'Active' : selectedTeamData.streakEnd ? `Ended ${selectedTeamData.streakEnd}` : 'Never'}
								</div>
								<div class="text-dark-muted text-sm">Status</div>
							</div>
						</div>

						<!-- Year-by-year timeline -->
						<div class="p-4 bg-dark-bg rounded-lg">
							<h5 class="font-semibold mb-3">Year-by-Year History</h5>
							<div class="flex flex-wrap gap-2">
								{#each availableYears.sort((a, b) => a - b) as year}
									<div
										class="px-3 py-1 rounded text-sm {selectedTeamData.qualifiedYears.includes(year) ? 'bg-green-600 text-white' : 'bg-dark-surface text-dark-muted'}"
									>
										{year}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
```

- [ ] **Step 6.2: Verify page renders**

Run: `npm run dev`
Navigate to: `http://localhost:5173/fim/2024/championship-streaks`
Expected: Page loads, shows loading state, then displays streaks table

- [ ] **Step 6.3: Commit**

```bash
git add src/routes/[district]/[year]/championship-streaks/+page.svelte
git commit -m "feat: add championship streaks page"
```

---

### Task 7: Add navigation links

**Files:**
- Modify: `src/routes/[district]/[year]/+layout.svelte`
- Modify: `src/routes/[district]/[year]/+page.svelte`

- [ ] **Step 7.1: Add nav tab to layout**

In `src/routes/[district]/[year]/+layout.svelte`, add a new nav tab after "Championships":

```svelte
<!-- Add after the Championships nav tab (around line 59) -->
<a
	href="{basePath}/championship-streaks"
	class="tab {currentPath.includes('championship-streaks') ? 'tab-active' : 'tab-inactive'}"
>
	Streaks
</a>
```

- [ ] **Step 7.2: Add link card to overview page**

In `src/routes/[district]/[year]/+page.svelte`, add a new analysis link card. Change the grid from 2 columns to 3 columns and add the new card:

```svelte
<!-- Change grid-cols-2 to grid-cols-3 and add new card -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
	<a href="/{data.district}/{data.year}/event-twins" class="card hover:border-blue-500 transition-colors">
		<h3 class="text-lg font-semibold mb-2">Event Twins</h3>
		<p class="text-dark-muted">Find teams that attended the same two district events</p>
	</a>
	<a href="/{data.district}/{data.year}/championships" class="card hover:border-blue-500 transition-colors">
		<h3 class="text-lg font-semibold mb-2">Championship History</h3>
		<p class="text-dark-muted">Explore qualification streaks, results, and Worlds advancement</p>
	</a>
	<a href="/{data.district}/{data.year}/championship-streaks" class="card hover:border-blue-500 transition-colors">
		<h3 class="text-lg font-semibold mb-2">Championship Streaks</h3>
		<p class="text-dark-muted">View consecutive championship qualification streaks for all teams</p>
	</a>
</div>
```

- [ ] **Step 7.3: Verify navigation works**

Run: `npm run dev`
Navigate to: `http://localhost:5173/fim/2024`
Verify: "Streaks" tab appears in header nav
Click: "Championship Streaks" card in analysis links
Expected: Navigates to championship streaks page

- [ ] **Step 7.4: Commit**

```bash
git add src/routes/[district]/[year]/+layout.svelte src/routes/[district]/[year]/+page.svelte
git commit -m "feat: add championship streaks navigation links"
```

---

### Task 8: Final testing and polish

**Files:**
- All created/modified files

- [ ] **Step 8.1: Run all tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 8.2: Run build to check for errors**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 8.3: Manual testing checklist**

Test in browser:
- [ ] `/fim/2024/championship-streaks` loads correctly
- [ ] "All Teams" tab shows sorted table (active streaks first)
- [ ] Clicking a row switches to "By Team" tab with that team selected
- [ ] "By Team" tab dropdown works
- [ ] Year timeline shows correct qualification status
- [ ] Status badges show correct colors (green for active, gray for ended)
- [ ] Works for other districts (e.g., `/fma/2024/championship-streaks`)

- [ ] **Step 8.4: Final commit**

```bash
git add -A
git commit -m "feat: complete championship streaks feature"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | extractChampionshipTeams function | src/lib/streaks.js, tests/lib/streaks.test.js |
| 2 | buildQualificationHistory function | src/lib/streaks.js, tests/lib/streaks.test.js |
| 3 | calculateStreak function | src/lib/streaks.js, tests/lib/streaks.test.js |
| 4 | calculateAllStreaks function | src/lib/streaks.js, tests/lib/streaks.test.js |
| 5 | loadAllDistrictYears helper | data.js |
| 6 | Championship streaks page | +page.svelte |
| 7 | Navigation links | +layout.svelte, +page.svelte |
| 8 | Final testing | All files |
