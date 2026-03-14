# Championship Streaks Feature Design

## Overview

Add a District Championship Streaks page that shows the longest consecutive qualifying streaks for all teams in a district, with indicators for whether each streak is currently active.

## Requirements

### Functional Requirements

1. **Qualification definition**: A team qualifies for District Championships if they appear in any championship event (events with keys containing `cmp`)

2. **Streak calculation**: Count consecutive years a team qualified, working backwards from their most recent qualification

3. **Active status**: A streak is "active" if it continues to the latest year available in the district data (e.g., 2026 for FIM)

4. **Scope**: Show all teams in the district, including those who never qualified (displayed as "0" or "Never qualified")

5. **Sorting**: Active streaks first, then sorted by streak length descending

6. **Navigation**: New page at `/[district]/[year]/championship-streaks/` as a sibling to existing championships page

### User Interface

Two-tab layout:

**Tab 1: All Teams**
- DataTable with sortable columns: Team, Name, Streak, Status, Since
- Status shows "Active" (green badge) or "Ended YYYY" (gray badge)
- Clicking a row navigates to that team's detail view

**Tab 2: By Team**
- Dropdown to select a team
- Stats cards: Current Streak, Total Qualifications, First Qualification
- Year-by-year timeline showing qualification status for each year

## Technical Design

### Approach

Client-side multi-year loading: Load all year files for the district when the page loads, compute streaks in the browser.

**Rationale**: Data files are small (~100-200KB each), modern browsers handle parallel fetches well, and this keeps the architecture simple without requiring changes to the data fetch script.

### Data Model

```javascript
{
  team: 1234,
  name: "Team Name",
  rookieYear: 2015,
  currentStreak: 5,
  streakStart: 2022,
  streakEnd: 2026,
  isActive: true,
  totalQualifications: 8
}
```

### Algorithm

1. Load all year files for the district (e.g., FIM 2009-2026)
2. For each year, extract teams from championship events (keys containing `cmp`)
3. Build a map: `team -> Set<years they qualified>`
4. For each team, calculate current streak:
   - Start from the latest year in data
   - Count consecutive years backwards where they qualified
   - If they qualified in latest year, streak is "active"
   - If not, find most recent qualifying year, count backwards from there, streak is "ended"

### File Structure

**New files:**
```
src/
├── routes/[district]/[year]/championship-streaks/
│   └── +page.svelte          # Main page component
└── lib/
    └── streaks.js            # Streak calculation logic
```

**Modified files:**
```
src/lib/data.js               # Add loadAllDistrictYears() helper
src/routes/[district]/[year]/+page.svelte  # Add navigation link
```

### Data Loading

Add helper function to `data.js`:

```javascript
export async function loadAllDistrictYears(district, years, fetchFn = fetch) {
  const promises = years.map(year =>
    loadDistrictYear(district, year, fetchFn)
  );
  return Promise.all(promises);
}
```

### Loading State

Display spinner with "Loading X years of data..." message while fetching multi-year data.

## Dependencies

- Reuses existing `DataTable` component
- Reuses existing dark theme styling
- No external dependencies required

## Testing Considerations

- Test streak calculation with various edge cases:
  - Team with no qualifications
  - Team with single qualification
  - Team with gaps in qualification history
  - Team with active vs. ended streak
- Test with districts that have different year ranges
