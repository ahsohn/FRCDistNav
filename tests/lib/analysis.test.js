import { describe, it, expect } from 'vitest';
import { findEventTwins, getAllEventPairings, getTeamChampionshipHistory } from '$lib/analysis.js';

const sampleData = {
	events: [
		{ key: 'event1', name: 'Event 1', teams: [1, 2, 3, 4] },
		{ key: 'event2', name: 'Event 2', teams: [1, 2, 5, 6] },
		{ key: 'event3', name: 'Event 3', teams: [3, 4, 5, 6] }
	],
	teams: {
		'1': { name: 'Team 1' },
		'2': { name: 'Team 2' },
		'3': { name: 'Team 3' },
		'4': { name: 'Team 4' },
		'5': { name: 'Team 5' },
		'6': { name: 'Team 6' }
	},
	championship: {
		rankings: [
			{ team: 1, rank: 1 },
			{ team: 2, rank: 2 }
		]
	}
};

describe('findEventTwins', () => {
	it('finds teams that share both events with given team', () => {
		const result = findEventTwins(sampleData, 1);

		expect(result.team).toBe(1);
		expect(result.events).toHaveLength(2);
		expect(result.events.map(e => e.key)).toContain('event1');
		expect(result.events.map(e => e.key)).toContain('event2');
		expect(result.twins).toContain(2);
		expect(result.twins).not.toContain(3);
	});

	it('returns empty twins for team with no shared partners', () => {
		const dataWithLoner = {
			...sampleData,
			events: [
				{ key: 'event1', name: 'Event 1', teams: [1, 2, 3] },
				{ key: 'event2', name: 'Event 2', teams: [1, 4, 5] }
			]
		};

		const result = findEventTwins(dataWithLoner, 1);

		expect(result.twins).toHaveLength(0);
	});
});

describe('getAllEventPairings', () => {
	it('returns all unique event pairings with team counts', () => {
		const result = getAllEventPairings(sampleData);

		expect(result).toBeInstanceOf(Array);
		expect(result.length).toBeGreaterThan(0);

		const event1And2 = result.find(
			p => p.events.includes('event1') && p.events.includes('event2')
		);
		expect(event1And2).toBeDefined();
		expect(event1And2.teams).toContain(1);
		expect(event1And2.teams).toContain(2);
	});
});

describe('getTeamChampionshipHistory', () => {
	it('returns championship rank for team', () => {
		const result = getTeamChampionshipHistory(sampleData, 1);

		expect(result.rank).toBe(1);
	});

	it('returns null for team not in championship', () => {
		const result = getTeamChampionshipHistory(sampleData, 99);

		expect(result).toBeNull();
	});
});
