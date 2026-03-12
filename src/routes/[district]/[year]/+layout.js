import { loadDistrictYear, loadDistricts } from '$lib/data.js';
import { error } from '@sveltejs/kit';

export async function load({ params, fetch }) {
	const { district, year } = params;
	const yearNum = parseInt(year, 10);

	try {
		const [districtData, districts] = await Promise.all([
			loadDistrictYear(district, yearNum, fetch),
			loadDistricts(fetch)
		]);

		const districtInfo = districts.find(d => d.key === district);

		return {
			districtData,
			districtInfo,
			district,
			year: yearNum,
			availableYears: districtInfo?.years || []
		};
	} catch (e) {
		throw error(404, `District ${district} ${year} not found`);
	}
}
