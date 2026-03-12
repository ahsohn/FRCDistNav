import { loadDistricts } from '$lib/data.js';

export async function load({ fetch }) {
	const districts = await loadDistricts(fetch);

	// Get the most recent year across all districts
	const allYears = districts.flatMap(d => d.years);
	const latestYear = Math.max(...allYears);

	return {
		districts,
		latestYear
	};
}
