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
