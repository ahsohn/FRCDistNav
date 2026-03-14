import { describe, it, expect } from 'vitest';
import { extractChampionshipTeams, buildQualificationHistory } from '../../src/lib/streaks.js';

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
