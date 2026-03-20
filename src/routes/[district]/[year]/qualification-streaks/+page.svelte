<script>
	import { onMount } from 'svelte';
	import { loadAllDistrictYears } from '$lib/data.js';
	import { buildTeamYearMatrix, getYearsWithChampionshipData } from '$lib/streaks.js';

	export let data;

	let loading = true;
	let matrixData = [];
	let sortedYears = [];
	let sortBy = 'qualifications';
	let filterText = '';

	$: districtInfo = data.districtInfo;
	$: currentYear = data.year;
	$: availableYears = districtInfo?.years || [];

	onMount(async () => {
		if (!districtInfo || availableYears.length === 0) {
			loading = false;
			return;
		}

		const allYearsData = await loadAllDistrictYears(
			data.district,
			availableYears
		);

		// Merge all teams from all years
		const allTeams = {};
		for (const yearData of allYearsData) {
			for (const [num, info] of Object.entries(yearData.teams || {})) {
				if (!allTeams[num]) {
					allTeams[num] = info;
				}
			}
		}

		const yearsWithChampionships = getYearsWithChampionshipData(allYearsData);
		sortedYears = [...availableYears].sort((a, b) => a - b);
		matrixData = buildTeamYearMatrix(allYearsData, allTeams, sortedYears);
		loading = false;
	});

	const statusColors = {
		worlds: 'bg-yellow-500',
		'worlds-direct': 'bg-yellow-500/60 worlds-direct-cell',
		qualified: 'bg-green-600',
		participated: 'bg-blue-800',
		inactive: 'bg-gray-700/50'
	};

	const statusLabels = {
		worlds: 'Worlds (via DCMP)',
		'worlds-direct': 'Worlds (bypassed DCMP)',
		qualified: 'District Championship',
		participated: 'Participated',
		inactive: 'Did Not Participate'
	};

	function sortTeams(teams, method) {
		const sorted = [...teams];
		switch (method) {
			case 'qualifications':
				sorted.sort((a, b) => {
					if (a.totalQualifications !== b.totalQualifications) return b.totalQualifications - a.totalQualifications;
					return a.team - b.team;
				});
				break;
			case 'team':
				sorted.sort((a, b) => a.team - b.team);
				break;
			case 'name':
				sorted.sort((a, b) => a.name.localeCompare(b.name));
				break;
		}
		return sorted;
	}

	$: filteredData = matrixData.filter(t => {
		if (!filterText) return true;
		const q = filterText.toLowerCase();
		return String(t.team).includes(q) || t.name.toLowerCase().includes(q);
	});

	$: displayData = sortTeams(filteredData, sortBy);
</script>

<svelte:head>
	<title>Qualification Streaks | {districtInfo?.name} {currentYear}</title>
</svelte:head>

<div>
	{#if loading}
		<div class="card">
			<p class="text-dark-muted">Loading {availableYears.length} years of data...</p>
		</div>
	{:else if matrixData.length === 0}
		<div class="card">
			<p class="text-dark-muted">No data available for this district.</p>
		</div>
	{:else}
		<!-- Legend -->
		<div class="card mb-6">
			<div class="flex flex-wrap items-center gap-4">
				<span class="text-sm text-dark-muted">Legend:</span>
				{#each Object.entries(statusColors) as [status, color]}
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 rounded {color}"></div>
						<span class="text-sm">{statusLabels[status]}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Controls -->
		<div class="card mb-6">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<label for="filter" class="block text-sm text-dark-muted mb-1">Filter teams</label>
					<input
						id="filter"
						type="text"
						bind:value={filterText}
						placeholder="Search by team number or name..."
						class="w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm"
					/>
				</div>
				<div>
					<label for="sort" class="block text-sm text-dark-muted mb-1">Sort by</label>
					<select
						id="sort"
						bind:value={sortBy}
						class="p-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm"
					>
						<option value="qualifications">Most Qualifications</option>
						<option value="team">Team Number</option>
						<option value="name">Team Name</option>
					</select>
				</div>
			</div>
			<p class="text-sm text-dark-muted mt-2">
				Showing {displayData.length} of {matrixData.length} teams across {sortedYears.length} seasons
			</p>
		</div>

		<!-- Matrix grid -->
		<div class="card overflow-x-auto">
			<table class="w-full border-collapse text-sm">
				<thead>
					<tr>
						<th class="sticky left-0 z-10 bg-dark-surface text-left px-3 py-2 text-dark-muted font-medium border-b border-dark-border min-w-[180px]">
							Team
						</th>
						{#each sortedYears as year}
							<th class="px-1 py-2 text-dark-muted font-medium border-b border-dark-border text-center">
								<span class="inline-block -rotate-45 origin-center text-xs whitespace-nowrap">
									{year}
								</span>
							</th>
						{/each}
						<th class="px-3 py-2 text-dark-muted font-medium border-b border-dark-border text-center">
							Qual
						</th>
					</tr>
				</thead>
				<tbody>
					{#each displayData as team}
						<tr class="hover:bg-dark-bg/50">
							<td class="sticky left-0 z-10 bg-dark-surface px-3 py-1.5 border-b border-dark-border/50 whitespace-nowrap">
								<span class="font-mono font-semibold">{team.team}</span>
								<span class="text-dark-muted ml-2 text-xs truncate">{team.name}</span>
							</td>
							{#each sortedYears as year}
								<td class="px-0.5 py-1.5 border-b border-dark-border/50 text-center">
									<div
										class="w-5 h-5 mx-auto rounded-sm {statusColors[team.yearStatuses[year]]}"
										title="{team.team} {team.name} - {year}: {statusLabels[team.yearStatuses[year]]}"
									></div>
								</td>
							{/each}
							<td class="px-3 py-1.5 border-b border-dark-border/50 text-center font-mono">
								{team.totalQualifications}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	:global(.worlds-direct-cell) {
		background-image: repeating-linear-gradient(
			-45deg,
			transparent,
			transparent 3px,
			rgba(0, 0, 0, 0.3) 3px,
			rgba(0, 0, 0, 0.3) 5px
		);
	}
</style>
