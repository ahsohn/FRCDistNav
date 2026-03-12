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

	for (const event of events) {
		const eventTeams = await fetchTBA(`/event/${event.key}/teams/keys`);
		const teamNumbers = eventTeams.map(k => parseInt(k.replace('frc', ''), 10));

		const eventEntry = {
			key: event.key,
			name: event.name,
			startDate: event.start_date,
			teams: teamNumbers
		};

		// Check if this is the district championship
		if (event.event_type === 2) { // District Championship
			// Fetch rankings
			const rankings = await fetchTBA(`/event/${event.key}/district_points`);
			const eventRankings = await fetchTBA(`/event/${event.key}/rankings`);

			championship = {
				key: event.key,
				name: event.name,
				startDate: event.start_date,
				rankings: eventRankings?.rankings?.map(r => ({
					team: parseInt(r.team_key.replace('frc', ''), 10),
					rank: r.rank,
					record: `${r.record.wins}-${r.record.losses}-${r.record.ties}`,
					playoff: null, // Would need alliance/playoff data
					advancedToWorlds: false // Would need to check worlds qualification
				})) || []
			};
		} else {
			eventData.push(eventEntry);
		}
	}

	return {
		district: districtKey,
		year,
		events: eventData,
		teams,
		championship
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

	// Collect all districts across years
	for (const year of years) {
		try {
			const districts = await fetchTBA(`/districts/${year}`);
			for (const d of districts) {
				const key = d.abbreviation.toLowerCase();
				if (!allDistricts.has(key)) {
					allDistricts.set(key, {
						key,
						name: d.display_name,
						years: []
					});
				}
				allDistricts.get(key).years.push(year);
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
	for (const [districtKey, district] of allDistricts) {
		console.log(`\nFetching ${district.name}...`);

		const districtDir = path.join(DATA_DIR, districtKey);
		await fs.mkdir(districtDir, { recursive: true });

		for (const year of district.years) {
			try {
				const data = await fetchDistrictYearData(districtKey, year);
				await fs.writeFile(
					path.join(districtDir, `${year}.json`),
					JSON.stringify(data, null, 2)
				);
			} catch (e) {
				console.error(`  Error fetching ${districtKey} ${year}: ${e.message}`);
			}

			// Rate limiting - TBA allows 100 requests per second
			await new Promise(r => setTimeout(r, 100));
		}
	}

	console.log('\nDone! Data saved to static/data/');
}

main().catch(console.error);
