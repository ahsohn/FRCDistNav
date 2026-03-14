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
