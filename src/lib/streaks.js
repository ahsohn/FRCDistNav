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
