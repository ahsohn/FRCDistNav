import { describe, it, expect } from 'vitest';
import { extractRookies, buildYearRookieData, buildRookieMatrix } from '../../src/lib/rookies.js';

const sampleYearData = {
	district: 'test',
	year: 2024,
	teams: {
		'100': { name: 'Veterans', rookie_year: 2000 },
		'9000': { name: 'New Team A', rookie_year: 2024 },
		'9001': { name: 'New Team B', rookie_year: 2024 },
		'9002': { name: 'New Team C', rookie_year: 2024 },
		'8000': { name: 'Last Year Rookie', rookie_year: 2023 }
	},
	events: [
		{ key: '2024test1', name: 'Event 1', teams: [100, 9000, 9001, 9002, 8000] }
	],
	championship: {
		key: '2024testcmp',
		name: 'Test Championship',
		rankings: [
			{ team: 100, rank: 1, record: '10-0-0', advancedToWorlds: false },
			{ team: 9000, rank: 5, record: '6-4-0', advancedToWorlds: false }
		]
	},
	worldsQualifiers: [],
	rookieAllStarEvent: [9001, 9002],
	rookieAllStarDcmp: [9001]
};

describe('extractRookies', () => {
	it('returns only teams whose rookie_year matches the data year', () => {
		const rookies = extractRookies(sampleYearData);
		const teamNums = rookies.map(r => r.team);
		expect(teamNums).toEqual([9000, 9001, 9002]);
	});

	it('returns empty array when no rookies', () => {
		const data = { ...sampleYearData, year: 1999 };
		expect(extractRookies(data)).toEqual([]);
	});
});

describe('buildYearRookieData', () => {
	it('marks rookies that competed at DCMP', () => {
		const rookies = buildYearRookieData(sampleYearData);
		const team9000 = rookies.find(r => r.team === 9000);
		expect(team9000.competedAtDcmp).toBe(true);
	});

	it('marks rookies that won RAS at event', () => {
		const rookies = buildYearRookieData(sampleYearData);
		const team9001 = rookies.find(r => r.team === 9001);
		expect(team9001.wonRasAtEvent).toBe(true);
		const team9000 = rookies.find(r => r.team === 9000);
		expect(team9000.wonRasAtEvent).toBe(false);
	});

	it('marks rookies that won RAS at DCMP', () => {
		const rookies = buildYearRookieData(sampleYearData);
		const team9001 = rookies.find(r => r.team === 9001);
		expect(team9001.wonRasAtDcmp).toBe(true);
		const team9002 = rookies.find(r => r.team === 9002);
		expect(team9002.wonRasAtDcmp).toBe(false);
	});

	it('identifies RAS winners who attended DCMP for award only (not in rankings)', () => {
		const rookies = buildYearRookieData(sampleYearData);
		// 9001 won RAS at event but is NOT in championship.rankings -> attended for award only
		const team9001 = rookies.find(r => r.team === 9001);
		expect(team9001.attendedDcmpForAward).toBe(true);
		expect(team9001.competedAtDcmp).toBe(false);

		// 9002 won RAS at event but is NOT in rankings -> attended for award only
		const team9002 = rookies.find(r => r.team === 9002);
		expect(team9002.attendedDcmpForAward).toBe(true);
		expect(team9002.competedAtDcmp).toBe(false);
	});

	it('handles missing award data gracefully', () => {
		const dataNoAwards = { ...sampleYearData, rookieAllStarEvent: undefined, rookieAllStarDcmp: undefined };
		const rookies = buildYearRookieData(dataNoAwards);
		expect(rookies.every(r => !r.wonRasAtEvent && !r.wonRasAtDcmp)).toBe(true);
	});
});

describe('buildRookieMatrix', () => {
	it('returns one entry per year sorted ascending', () => {
		const data2023 = {
			...sampleYearData,
			year: 2023,
			teams: { '8000': { name: 'Team 8000', rookie_year: 2023 } },
			championship: null,
			rookieAllStarEvent: [],
			rookieAllStarDcmp: []
		};
		const matrix = buildRookieMatrix([sampleYearData, data2023]);
		expect(matrix.length).toBe(2);
		expect(matrix[0].year).toBe(2023);
		expect(matrix[1].year).toBe(2024);
	});

	it('includes correct rookie count per year', () => {
		const matrix = buildRookieMatrix([sampleYearData]);
		expect(matrix[0].rookies.length).toBe(3);
	});
});
