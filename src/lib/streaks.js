/**
 * Extract teams that participated in championship events
 * @param {Object} yearData - Single year district data
 * @returns {Set<number>} Set of team numbers
 */
export function extractChampionshipTeams(yearData) {
	const teams = new Set();
	for (const event of yearData.events || []) {
		if (event.key.includes('cmp')) {
			// Multi-division championships have teams array
			if (event.teams) {
				for (const team of event.teams) {
					teams.add(team);
				}
			}
			// Single-division championships have rankings with team info
			if (event.rankings) {
				for (const entry of event.rankings) {
					teams.add(entry.team);
				}
			}
		}
	}
	return teams;
}

/**
 * Get years that actually have championship event data
 * Filters out years where championships haven't happened yet
 * @param {Array<Object>} allYearsData - Array of year data objects
 * @returns {Array<number>} Years that have championship events
 */
export function getYearsWithChampionshipData(allYearsData) {
	return allYearsData
		.filter(yearData => extractChampionshipTeams(yearData).size > 0)
		.map(yearData => yearData.year);
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
