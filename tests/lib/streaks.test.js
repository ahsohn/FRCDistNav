import { describe, it, expect } from 'vitest';
import { extractChampionshipTeams, buildQualificationHistory, calculateStreak } from '../../src/lib/streaks.js';

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
