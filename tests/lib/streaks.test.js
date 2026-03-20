import { describe, it, expect } from 'vitest';
import {
	extractChampionshipTeams,
	getYearsWithChampionshipData,
	buildQualificationHistory,
	calculateStreak,
	calculateAllStreaks,
	extractWorldsTeams,
	extractWorldsDirectTeams,
	extractParticipatingTeams,
	buildTeamYearMatrix
} from '../../src/lib/streaks.js';

describe('extractChampionshipTeams', () => {
	it('extracts teams from multi-division championship events (teams array)', () => {
		const yearData = {
			year: 2023,
			events: [
				{ key: '2023miev1', name: 'Event 1', teams: [1, 2, 3] },
				{ key: '2023micmp1', name: 'Champ Div 1', teams: [10, 20, 30] },
				{ key: '2023micmp2', name: 'Champ Div 2', teams: [40, 50] }
			]
		};

		const result = extractChampionshipTeams(yearData);
		expect(result).toEqual(new Set([10, 20, 30, 40, 50]));
	});

	it('extracts teams from root-level championship object (single-division districts)', () => {
		const yearData = {
			year: 2024,
			events: [
				{ key: '2024vaash', name: 'CHS District Ashland VA Event', teams: [1, 2, 3] }
			],
			championship: {
				key: '2024chcmp',
				name: 'FIRST Chesapeake District Championship',
				rankings: [
					{ team: 836, rank: 1 },
					{ team: 1731, rank: 2 },
					{ team: 4099, rank: 3 }
				]
			}
		};

		const result = extractChampionshipTeams(yearData);
		expect(result).toEqual(new Set([836, 1731, 4099]));
	});
});

describe('getYearsWithChampionshipData', () => {
	it('returns only years that have championship events', () => {
		const allYearsData = [
			{
				year: 2024,
				events: [{ key: '2024micmp1', teams: [1, 2] }]
			},
			{
				year: 2025,
				events: [{ key: '2025micmp1', teams: [1, 3] }]
			},
			{
				year: 2026,
				events: [{ key: '2026miev1', teams: [1, 2, 3] }] // No championship event yet
			}
		];

		const result = getYearsWithChampionshipData(allYearsData);
		expect(result).toEqual([2024, 2025]); // 2026 excluded - no cmp events
	});

	it('returns empty array when no years have championship data', () => {
		const allYearsData = [
			{
				year: 2026,
				events: [{ key: '2026miev1', teams: [1, 2] }]
			}
		];

		const result = getYearsWithChampionshipData(allYearsData);
		expect(result).toEqual([]);
	});
});

describe('buildQualificationHistory', () => {
	it('builds map of team to years they qualified', () => {
		const allYearsData = [
			{
				year: 2022,
				events: [
					{ key: '2022micmp1', teams: [1, 2] }
				]
			},
			{
				year: 2023,
				events: [
					{ key: '2023micmp1', teams: [1, 3] }
				]
			}
		];

		const result = buildQualificationHistory(allYearsData);

		expect(result.get(1)).toEqual(new Set([2022, 2023]));
		expect(result.get(2)).toEqual(new Set([2022]));
		expect(result.get(3)).toEqual(new Set([2023]));
	});

	it('includes Worlds-direct teams in qualification history', () => {
		const allYearsData = [
			{
				year: 2022,
				events: [],
				teams: { 100: { name: 'A' }, 999: { name: 'B' } },
				worldsQualifiers: [
					{ team: 999, dcmpAttended: false }
				]
			}
		];

		const result = buildQualificationHistory(allYearsData);
		expect(result.get(999)).toEqual(new Set([2022]));
	});
});

describe('calculateStreak', () => {
	const availableYears = [2020, 2021, 2022, 2023, 2024];

	it('calculates active streak when team qualified in latest year', () => {
		const qualifiedYears = new Set([2022, 2023, 2024]);
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 3,
			start: 2022,
			end: 2024,
			isActive: true
		});
	});

	it('calculates ended streak when team did not qualify in latest year', () => {
		const qualifiedYears = new Set([2021, 2022, 2023]);
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 3,
			start: 2021,
			end: 2023,
			isActive: false
		});
	});

	it('handles team with no qualifications', () => {
		const qualifiedYears = new Set();
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 0,
			start: null,
			end: null,
			isActive: false
		});
	});

	it('handles single year qualification', () => {
		const qualifiedYears = new Set([2022]);
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 1,
			start: 2022,
			end: 2022,
			isActive: false
		});
	});

	it('finds most recent streak when there are gaps', () => {
		const qualifiedYears = new Set([2020, 2023, 2024]);
		const result = calculateStreak(qualifiedYears, availableYears);

		expect(result).toEqual({
			length: 2,
			start: 2023,
			end: 2024,
			isActive: true
		});
	});
});

describe('extractWorldsTeams', () => {
	it('extracts teams with advancedToWorlds from championship rankings', () => {
		const yearData = {
			year: 2024,
			events: [],
			championship: {
				key: '2024pncmp',
				rankings: [
					{ team: 100, rank: 1, advancedToWorlds: true },
					{ team: 200, rank: 2, advancedToWorlds: false },
					{ team: 300, rank: 3, advancedToWorlds: true }
				]
			}
		};

		const result = extractWorldsTeams(yearData);
		expect(result).toEqual(new Set([100, 300]));
	});

	it('extracts teams from championship events in events array', () => {
		const yearData = {
			year: 2024,
			events: [
				{
					key: '2024micmp1',
					rankings: [
						{ team: 10, advancedToWorlds: true },
						{ team: 20, advancedToWorlds: false }
					]
				}
			]
		};

		const result = extractWorldsTeams(yearData);
		expect(result).toEqual(new Set([10]));
	});

	it('returns empty set when no teams advanced', () => {
		const yearData = {
			year: 2024,
			events: [],
			championship: {
				rankings: [
					{ team: 100, advancedToWorlds: false }
				]
			}
		};

		const result = extractWorldsTeams(yearData);
		expect(result).toEqual(new Set());
	});

	it('includes teams from worldsQualifiers who bypassed DCMP', () => {
		const yearData = {
			year: 2024,
			events: [],
			championship: {
				rankings: [
					{ team: 100, rank: 1, advancedToWorlds: true }
				]
			},
			worldsQualifiers: [
				{ team: 100, dcmpAttended: true },
				{ team: 999, dcmpAttended: false }
			]
		};

		const result = extractWorldsTeams(yearData);
		expect(result).toEqual(new Set([100, 999]));
	});
});

describe('extractWorldsDirectTeams', () => {
	it('extracts teams that went to Worlds without attending DCMP', () => {
		const yearData = {
			worldsQualifiers: [
				{ team: 100, dcmpAttended: true },
				{ team: 999, dcmpAttended: false },
				{ team: 888, dcmpAttended: false }
			]
		};

		const result = extractWorldsDirectTeams(yearData);
		expect(result).toEqual(new Set([999, 888]));
	});

	it('returns empty set when no worldsQualifiers', () => {
		const result = extractWorldsDirectTeams({ year: 2024 });
		expect(result).toEqual(new Set());
	});

	it('returns empty set when all qualifiers attended DCMP', () => {
		const yearData = {
			worldsQualifiers: [
				{ team: 100, dcmpAttended: true }
			]
		};

		const result = extractWorldsDirectTeams(yearData);
		expect(result).toEqual(new Set());
	});
});

describe('extractParticipatingTeams', () => {
	it('extracts team numbers from teams object', () => {
		const yearData = {
			teams: { '100': { name: 'A' }, '200': { name: 'B' } }
		};

		const result = extractParticipatingTeams(yearData);
		expect(result).toEqual(new Set([100, 200]));
	});

	it('returns empty set when no teams', () => {
		const result = extractParticipatingTeams({});
		expect(result).toEqual(new Set());
	});
});

describe('buildTeamYearMatrix', () => {
	it('builds correct status matrix for all teams across years', () => {
		const allYearsData = [
			{
				year: 2022,
				events: [{ key: '2022cmp', teams: [1, 2] }],
				teams: { 1: { name: 'A' }, 2: { name: 'B' }, 3: { name: 'C' } },
				championship: {
					rankings: [
						{ team: 1, advancedToWorlds: true },
						{ team: 2, advancedToWorlds: false }
					]
				}
			},
			{
				year: 2023,
				events: [{ key: '2023cmp', teams: [1] }],
				teams: { 1: { name: 'A' }, 3: { name: 'C' } }
			}
		];
		const allTeams = {
			1: { name: 'A' },
			2: { name: 'B' },
			3: { name: 'C' }
		};
		const availableYears = [2022, 2023];

		const result = buildTeamYearMatrix(allYearsData, allTeams, availableYears);

		// Team 1: worlds in 2022, qualified in 2023
		const team1 = result.find(t => t.team === 1);
		expect(team1.yearStatuses[2022]).toBe('worlds');
		expect(team1.yearStatuses[2023]).toBe('qualified');
		expect(team1.totalQualifications).toBe(2);
		expect(team1.totalWorlds).toBe(1);

		// Team 2: qualified in 2022, inactive in 2023
		const team2 = result.find(t => t.team === 2);
		expect(team2.yearStatuses[2022]).toBe('qualified');
		expect(team2.yearStatuses[2023]).toBe('inactive');
		expect(team2.totalQualifications).toBe(1);

		// Team 3: participated in 2022 and 2023 but never qualified
		const team3 = result.find(t => t.team === 3);
		expect(team3.yearStatuses[2022]).toBe('participated');
		expect(team3.yearStatuses[2023]).toBe('participated');
		expect(team3.totalQualifications).toBe(0);
	});

	it('assigns worlds-direct status for teams that bypassed DCMP', () => {
		const allYearsData = [
			{
				year: 2022,
				events: [],
				teams: { 100: { name: 'DCMP Team' }, 999: { name: 'Wildcard Team' } },
				championship: {
					rankings: [
						{ team: 100, advancedToWorlds: true }
					]
				},
				worldsQualifiers: [
					{ team: 100, dcmpAttended: true },
					{ team: 999, dcmpAttended: false }
				]
			}
		];
		const allTeams = {
			100: { name: 'DCMP Team' },
			999: { name: 'Wildcard Team' }
		};

		const result = buildTeamYearMatrix(allYearsData, allTeams, [2022]);

		const dcmpTeam = result.find(t => t.team === 100);
		expect(dcmpTeam.yearStatuses[2022]).toBe('worlds');
		expect(dcmpTeam.totalWorlds).toBe(1);

		const wildcardTeam = result.find(t => t.team === 999);
		expect(wildcardTeam.yearStatuses[2022]).toBe('worlds-direct');
		expect(wildcardTeam.totalWorlds).toBe(1);
		expect(wildcardTeam.totalQualifications).toBe(1);
	});

	it('sorts by total qualifications descending then team number', () => {
		const allYearsData = [
			{
				year: 2022,
				events: [{ key: '2022cmp', teams: [2] }],
				teams: { 1: { name: 'A' }, 2: { name: 'B' } }
			},
			{
				year: 2023,
				events: [{ key: '2023cmp', teams: [2] }],
				teams: { 1: { name: 'A' }, 2: { name: 'B' } }
			}
		];
		const allTeams = { 1: { name: 'A' }, 2: { name: 'B' } };

		const result = buildTeamYearMatrix(allYearsData, allTeams, [2022, 2023]);

		expect(result[0].team).toBe(2); // 2 qualifications
		expect(result[1].team).toBe(1); // 0 qualifications
	});
});

describe('calculateAllStreaks', () => {
	it('calculates streaks for all teams and sorts correctly', () => {
		const allYearsData = [
			{
				year: 2022,
				events: [{ key: '2022cmp', teams: [1, 2] }],
				teams: { 1: { name: 'Team One', rookie_year: 2010 }, 2: { name: 'Team Two', rookie_year: 2015 } }
			},
			{
				year: 2023,
				events: [{ key: '2023cmp', teams: [1] }],
				teams: { 1: { name: 'Team One', rookie_year: 2010 }, 3: { name: 'Team Three', rookie_year: 2020 } }
			}
		];
		const allTeams = {
			1: { name: 'Team One', rookie_year: 2010 },
			2: { name: 'Team Two', rookie_year: 2015 },
			3: { name: 'Team Three', rookie_year: 2020 }
		};
		const availableYears = [2022, 2023];

		const result = calculateAllStreaks(allYearsData, allTeams, availableYears);

		// Team 1: 2-year active streak (first)
		// Team 2: 1-year ended streak
		// Team 3: 0-year never qualified (last)
		expect(result[0].team).toBe(1);
		expect(result[0].currentStreak).toBe(2);
		expect(result[0].isActive).toBe(true);

		expect(result[1].team).toBe(2);
		expect(result[1].currentStreak).toBe(1);
		expect(result[1].isActive).toBe(false);

		expect(result[2].team).toBe(3);
		expect(result[2].currentStreak).toBe(0);
		expect(result[2].isActive).toBe(false);
	});
});
