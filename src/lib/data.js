/**
 * Load the districts index
 * @returns {Promise<Array<{key: string, name: string, years: number[]}>>}
 */
export async function loadDistricts() {
	const response = await fetch('/data/districts.json');
	const data = await response.json();
	return data.districts;
}

/**
 * Load data for a specific district and year
 * @param {string} district - District key (e.g., 'fim')
 * @param {number} year - Year (e.g., 2024)
 * @returns {Promise<Object>}
 */
export async function loadDistrictYear(district, year) {
	const response = await fetch(`/data/${district}/${year}.json`);
	const data = await response.json();
	return data;
}
