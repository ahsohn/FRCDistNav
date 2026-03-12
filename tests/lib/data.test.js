import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadDistricts, loadDistrictYear } from '$lib/data.js';

// Mock fetch
global.fetch = vi.fn();

describe('loadDistricts', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns districts array from JSON', async () => {
		const mockData = {
			districts: [
				{ key: 'fim', name: 'Michigan', years: [2024] }
			]
		};
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData)
		});

		const result = await loadDistricts();

		expect(result).toEqual(mockData.districts);
		expect(global.fetch).toHaveBeenCalledWith('/data/districts.json');
	});
});

describe('loadDistrictYear', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns district year data from JSON', async () => {
		const mockData = {
			district: 'fim',
			year: 2024,
			events: [],
			teams: {},
			championship: null
		};
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData)
		});

		const result = await loadDistrictYear('fim', 2024);

		expect(result).toEqual(mockData);
		expect(global.fetch).toHaveBeenCalledWith('/data/fim/2024.json');
	});
});
