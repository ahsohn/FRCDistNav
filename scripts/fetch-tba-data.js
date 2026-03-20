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

// District renames - map old abbreviations to current canonical names
// FIRST renamed some districts but they're the same district
const DISTRICT_RENAMES = {
	'mar': 'fma',  // Mid-Atlantic → FIRST Mid-Atlantic
	'chs': 'fch',  // Chesapeake → FIRST Chesapeake
	'tx': 'fit',   // FIRST In Texas (old) → FIRST In Texas (new)
	'in': 'fin',   // FIRST Indiana Robotics (old) → FIRST Indiana Robotics (new)
	'nc': 'fnc',   // North Carolina → FIRST North Carolina
};

const DISTRICT_CANONICAL_NAMES = {
	'fma': 'FIRST Mid-Atlantic',
	'fch': 'FIRST Chesapeake',
	'fit': 'FIRST In Texas',
	'fin': 'FIRST Indiana Robotics',
	'fnc': 'FIRST North Carolina',
};

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

// Cache of Worlds team sets by year
const worldsTeamsByYear = new Map();

/**
 * Fetch the set of teams that actually competed at FRC World Championships for a given year.
 * Uses event_type 3 (CMP_DIVISION) from TBA, checking rankings to exclude teams
 * that only attended for awards (e.g., Dean's List) without competing in matches.
 */
async function getWorldsTeams(year) {
	if (worldsTeamsByYear.has(year)) {
		return worldsTeamsByYear.get(year);
	}

	const worldsTeams = new Set();
	try {
		const events = await fetchTBA(`/events/${year}`);
		// Use CMP_DIVISION (type 3) events which have rankings for competing teams.
		// CMP_FINALS (type 4) is Einstein/overall finals and doesn't reliably list all competitors.
		const cmpDivisions = events.filter(e => e.event_type === 3);

		for (const event of cmpDivisions) {
			const rankings = await fetchTBA(`/event/${event.key}/rankings`);
			if (rankings?.rankings) {
				for (const r of rankings.rankings) {
					worldsTeams.add(parseInt(r.team_key.replace('frc', ''), 10));
				}
			}
			await new Promise(r => setTimeout(r, 100));
		}
		console.log(`    Found ${worldsTeams.size} teams at Worlds ${year} (${cmpDivisions.length} divisions)`);
	} catch (e) {
		console.error(`    Error fetching Worlds teams for ${year}: ${e.message}`);
	}

	worldsTeamsByYear.set(year, worldsTeams);
	return worldsTeams;
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
	const dcmpDivisions = []; // District Championship Division events (event_type 5)

	for (const event of events) {
		const eventTeams = await fetchTBA(`/event/${event.key}/teams/keys`);
		const teamNumbers = eventTeams.map(k => parseInt(k.replace('frc', ''), 10));

		const eventEntry = {
			key: event.key,
			name: event.name,
			startDate: event.start_date,
			teams: teamNumbers
		};

		if (event.event_type === 2) { // District Championship (parent)
			// Fetch rankings from the parent event
			const eventRankings = await fetchTBA(`/event/${event.key}/rankings`);

			championship = {
				key: event.key,
				name: event.name,
				startDate: event.start_date,
				rankings: eventRankings?.rankings?.map(r => {
					const teamNum = parseInt(r.team_key.replace('frc', ''), 10);
					return {
						team: teamNum,
						rank: r.rank,
						record: `${r.record.wins}-${r.record.losses}-${r.record.ties}`,
						playoff: null,
						advancedToWorlds: false // Will be filled in below
					};
				}) || []
			};
		} else if (event.event_type === 5) { // District Championship Division
			dcmpDivisions.push(event);
			// Don't add to regular eventData
		} else {
			eventData.push(eventEntry);
		}
	}

	// If divisions exist but no parent DCMP was found, create the championship entry
	if (!championship && dcmpDivisions.length > 0) {
		const firstDiv = dcmpDivisions[0];
		championship = {
			key: firstDiv.key.replace(/\d+$/, ''),
			name: firstDiv.name.replace(/ - .*/, ''),
			startDate: firstDiv.start_date,
			rankings: []
		};
	}

	// If the parent DCMP has no rankings but divisions exist, merge division rankings
	if (championship && championship.rankings.length === 0 && dcmpDivisions.length > 0) {
		console.log(`    DCMP has ${dcmpDivisions.length} divisions, merging rankings...`);
		const allRankings = [];
		for (const div of dcmpDivisions) {
			const divRankings = await fetchTBA(`/event/${div.key}/rankings`);
			if (divRankings?.rankings) {
				for (const r of divRankings.rankings) {
					const teamNum = parseInt(r.team_key.replace('frc', ''), 10);
					allRankings.push({
						team: teamNum,
						rank: r.rank,
						record: `${r.record.wins}-${r.record.losses}-${r.record.ties}`,
						playoff: null,
						advancedToWorlds: false, // Will be filled in below
						division: div.key
					});
				}
			}
			await new Promise(r => setTimeout(r, 100));
		}
		// Sort by rank within each division (rankings are per-division, not overall)
		championship.rankings = allRankings;
	}

	// Fill in advancedToWorlds for all championship rankings
	if (championship && championship.rankings.length > 0) {
		const worldsTeams = await getWorldsTeams(year);
		for (const ranking of championship.rankings) {
			ranking.advancedToWorlds = worldsTeams.has(ranking.team);
		}
	}

	// Build worldsQualifiers - all district teams that went to Worlds,
	// including those who bypassed DCMP (wild cards, Chairman's Award, etc.)
	const worldsTeams = await getWorldsTeams(year);
	const dcmpTeams = new Set(
		(championship?.rankings || []).map(r => r.team)
	);
	const worldsQualifiers = [];
	for (const teamNum of Object.keys(teams)) {
		const num = parseInt(teamNum, 10);
		if (worldsTeams.has(num)) {
			worldsQualifiers.push({
				team: num,
				dcmpAttended: dcmpTeams.has(num)
			});
		}
	}

	return {
		district: districtKey,
		year,
		events: eventData,
		teams,
		championship,
		worldsQualifiers
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
	// Track which TBA key to use for each district/year combo
	const tbaKeysByYear = new Map(); // Map<canonicalKey, Map<year, tbaKey>>

	// Collect all districts across years
	for (const year of years) {
		try {
			const districts = await fetchTBA(`/districts/${year}`);
			for (const d of districts) {
				const tbaKey = d.abbreviation.toLowerCase();
				// Map to canonical key (handles renames like mar→fma, chs→fch)
				const canonicalKey = DISTRICT_RENAMES[tbaKey] || tbaKey;

				if (!allDistricts.has(canonicalKey)) {
					allDistricts.set(canonicalKey, {
						key: canonicalKey,
						name: DISTRICT_CANONICAL_NAMES[canonicalKey] || d.display_name,
						years: []
					});
					tbaKeysByYear.set(canonicalKey, new Map());
				}
				allDistricts.get(canonicalKey).years.push(year);
				tbaKeysByYear.get(canonicalKey).set(year, tbaKey);
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
	for (const [canonicalKey, district] of allDistricts) {
		console.log(`\nFetching ${district.name}...`);

		const districtDir = path.join(DATA_DIR, canonicalKey);
		await fs.mkdir(districtDir, { recursive: true });

		for (const year of district.years) {
			try {
				// Use the actual TBA key for this year (may differ due to renames)
				const tbaKey = tbaKeysByYear.get(canonicalKey).get(year);
				const data = await fetchDistrictYearData(tbaKey, year);
				// Store under canonical key
				data.district = canonicalKey;
				await fs.writeFile(
					path.join(districtDir, `${year}.json`),
					JSON.stringify(data, null, 2)
				);
			} catch (e) {
				console.error(`  Error fetching ${canonicalKey} ${year}: ${e.message}`);
			}

			// Rate limiting - TBA allows 100 requests per second
			await new Promise(r => setTimeout(r, 100));
		}
	}

	console.log('\nDone! Data saved to static/data/');
}

main().catch(console.error);
