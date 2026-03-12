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
