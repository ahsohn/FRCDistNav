import { extractChampionshipTeams } from './streaks.js';

/**
 * Extract rookies for a given year from district data
 * A rookie is a team whose rookie_year matches the data year
 * @param {Object} yearData - Single year district data
 * @returns {Array<{team: number, name: string}>} Array of rookie teams
 */
export function extractRookies(yearData) {
	const rookies = [];
	for (const [teamNum, teamInfo] of Object.entries(yearData.teams || {})) {
		if (teamInfo.rookie_year === yearData.year) {
			rookies.push({
				team: parseInt(teamNum, 10),
				name: teamInfo.name || `Team ${teamNum}`
			});
		}
	}
	rookies.sort((a, b) => a.team - b.team);
	return rookies;
}

/**
 * Build a set of rookies that likely won Rookie All Star at DCMP
 * by inferring from worldsQualifiers data. A rookie in worldsQualifiers
 * with dcmpAttended=false went to Worlds without competing at DCMP,
 * which for rookies means they won RAS at DCMP.
 * @param {Object} yearData - Single year district data
 * @param {Set<number>} rookieTeamNums - Set of rookie team numbers
 * @returns {Set<number>} Set of team numbers inferred as DCMP RAS winners
 */
function inferDcmpRasFromWorlds(yearData, rookieTeamNums) {
	const inferred = new Set();
	for (const entry of yearData.worldsQualifiers || []) {
		if (typeof entry === 'object' && !entry.dcmpAttended && rookieTeamNums.has(entry.team)) {
			inferred.add(entry.team);
		}
	}
	return inferred;
}

/**
 * Build rookie data for a single year including achievements
 * @param {Object} yearData - Single year district data
 * @returns {Object} Rookie data for the year
 */
export function buildYearRookieData(yearData) {
	const rookies = extractRookies(yearData);
	const dcmpTeams = extractChampionshipTeams(yearData);
	const rookieTeamNums = new Set(rookies.map(r => r.team));

	// Use explicit award data if available, otherwise infer from worldsQualifiers
	const hasExplicitAwardData = yearData.rookieAllStarEvent || yearData.rookieAllStarDcmp;
	const rasEventWinners = new Set(yearData.rookieAllStarEvent || []);
	const rasDcmpWinners = new Set(yearData.rookieAllStarDcmp || []);

	if (!hasExplicitAwardData) {
		// Infer DCMP RAS winners: rookies that went to Worlds with dcmpAttended=false
		const inferred = inferDcmpRasFromWorlds(yearData, rookieTeamNums);
		for (const team of inferred) {
			rasDcmpWinners.add(team);
			// DCMP RAS winners must have also won RAS at a district event
			rasEventWinners.add(team);
		}
	}

	return rookies.map(rookie => {
		const competedAtDcmp = dcmpTeams.has(rookie.team);
		const wonRasAtEvent = rasEventWinners.has(rookie.team);
		const wonRasAtDcmp = rasDcmpWinners.has(rookie.team);

		// A team can attend DCMP for the RAS award without competing in matches
		// They competed in matches only if they appear in championship rankings
		const attendedDcmpForAward = wonRasAtEvent && !competedAtDcmp;

		return {
			...rookie,
			competedAtDcmp,
			wonRasAtEvent,
			wonRasAtDcmp,
			attendedDcmpForAward
		};
	});
}

/**
 * Build a full rookie matrix across all years of a district
 * @param {Array<Object>} allYearsData - Array of year data objects
 * @returns {Array<{year: number, rookies: Array}>} Rookie data per year, sorted ascending
 */
export function buildRookieMatrix(allYearsData) {
	const result = [];

	for (const yearData of allYearsData) {
		const rookies = buildYearRookieData(yearData);
		result.push({
			year: yearData.year,
			rookies
		});
	}

	result.sort((a, b) => a.year - b.year);
	return result;
}
