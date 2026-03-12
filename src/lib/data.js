/**
 * Load the districts index
 * @param {typeof fetch} [fetchFn] - Optional fetch function (for SSR)
 * @returns {Promise<Array<{key: string, name: string, years: number[]}>>}
 */
export async function loadDistricts(fetchFn = fetch) {
	const response = await fetchFn('/data/districts.json');
	const data = await response.json();
	return data.districts;
}

/**
 * Load data for a specific district and year
 * @param {string} district - District key (e.g., 'fim')
 * @param {number} year - Year (e.g., 2024)
 * @param {typeof fetch} [fetchFn] - Optional fetch function (for SSR)
 * @returns {Promise<Object>}
 */
export async function loadDistrictYear(district, year, fetchFn = fetch) {
	const response = await fetchFn(`/data/${district}/${year}.json`);
	const data = await response.json();
	return data;
}
