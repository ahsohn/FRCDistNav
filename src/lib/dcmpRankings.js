import { extractChampionshipTeams, extractWorldsTeams } from './streaks.js';

/**
 * Build entering DCMP rankings for a single year
 * @param {Object} yearData - Single year district data
 * @returns {Array<Object>} Array of { team, enteringRank, madeWorlds, endingDistrictRank, teamName }
 */
export function buildDcmpEnteringRankings(yearData) {
	if (!yearData.districtRankings || yearData.districtRankings.length === 0) {
		return [];
	}

	const dcmpTeams = extractChampionshipTeams(yearData);
	const worldsTeams = extractWorldsTeams(yearData);

	if (dcmpTeams.size === 0) return [];

	// Filter district rankings to only DCMP teams, sort by pre-DCMP points descending
	const dcmpRankings = yearData.districtRankings
		.filter(r => dcmpTeams.has(r.team))
		.sort((a, b) => b.preDcmpPoints - a.preDcmpPoints);

	return dcmpRankings.map((r, i) => ({
		team: r.team,
		enteringRank: i + 1,
		madeWorlds: worldsTeams.has(r.team),
		endingDistrictRank: r.rank,
		teamName: yearData.teams?.[r.team]?.name || `Team ${r.team}`,
		preDcmpPoints: r.preDcmpPoints
	}));
}

/**
 * Build the DCMP rankings matrix across all years
 * Each row is an entering rank position, each column is a year
 * @param {Array<Object>} allYearsData - Array of year data objects
 * @param {Array<number>} years - Years to include (sorted ascending)
 * @returns {{ matrix: Array<Object>, years: Array<number>, maxRank: number }}
 */
export function buildDcmpRankingsMatrix(allYearsData, years) {
	const skippedYears = new Set([2020, 2021]);
	const filteredYears = years.filter(y => !skippedYears.has(y));

	// Build per-year rankings
	const yearRankings = {};
	let maxRank = 0;

	for (const yearData of allYearsData) {
		if (skippedYears.has(yearData.year)) continue;
		const rankings = buildDcmpEnteringRankings(yearData);
		if (rankings.length > 0) {
			yearRankings[yearData.year] = rankings;
			maxRank = Math.max(maxRank, rankings.length);
		}
	}

	const activeYears = filteredYears.filter(y => yearRankings[y]);

	// Build matrix: rows are entering ranks, columns are years
	const matrix = [];
	for (let rank = 1; rank <= maxRank; rank++) {
		const row = { enteringRank: rank, years: {} };
		for (const year of activeYears) {
			const rankings = yearRankings[year];
			const entry = rankings?.find(r => r.enteringRank === rank);
			row.years[year] = entry || null;
		}
		matrix.push(row);
	}

	return { matrix, years: activeYears, maxRank };
}
