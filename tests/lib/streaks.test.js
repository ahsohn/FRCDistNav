import { describe, it, expect } from 'vitest';
import {
	extractChampionshipTeams,
	getYearsWithChampionshipData,
	buildQualificationHistory,
	calculateStreak,
	calculateAllStreaks
} from '../../src/lib/streaks.js';

describe('extractChampionshipTeams', () => {
	it('extracts teams from championship events (keys containing cmp)', () => {
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
