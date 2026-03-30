<script>
	import { onMount } from 'svelte';
	import { loadAllDistrictYears } from '$lib/data.js';
	import { buildDcmpRankingsMatrix } from '$lib/dcmpRankings.js';

	export let data;

	let loading = true;
	let matrix = [];
	let activeYears = [];
	let maxRank = 0;

	$: districtInfo = data.districtInfo;
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

		const sortedYears = [...availableYears].sort((a, b) => a - b);
		const result = buildDcmpRankingsMatrix(allYearsData, sortedYears);
		matrix = result.matrix;
		activeYears = result.years;
		maxRank = result.maxRank;
		loading = false;
	});
</script>

<svelte:head>
	<title>DCMP Rankings | {districtInfo?.name} {data.year}</title>
</svelte:head>

<div>
	{#if loading}
		<div class="card">
			<p class="text-dark-muted">Loading {availableYears.length} years of data...</p>
		</div>
	{:else if matrix.length === 0}
		<div class="card">
			<p class="text-dark-muted">No district rankings data available. Re-run <code>npm run fetch-data</code> to populate district rankings.</p>
		</div>
	{:else}
		<!-- Legend -->
		<div class="card mb-6">
			<div class="flex flex-wrap items-center gap-4">
				<span class="text-sm text-dark-muted">Legend:</span>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-yellow-500"></div>
					<span class="text-sm">Made Worlds</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-dark-border"></div>
					<span class="text-sm">Did Not Make Worlds</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-dark-bg/50"></div>
					<span class="text-sm">No Team at This Rank</span>
				</div>
			</div>
			<p class="text-sm text-dark-muted mt-2">
				Teams ranked by district points entering DCMP. 2020 and 2021 omitted. Hover for details.
			</p>
		</div>

		<!-- Matrix grid -->
		<div class="card overflow-x-auto">
			<table class="w-full border-collapse text-sm">
				<thead>
					<tr>
						<th class="sticky left-0 z-10 bg-dark-surface text-left px-3 py-2 text-dark-muted font-medium border-b border-dark-border min-w-[60px]">
							Rank entering DCMP
						</th>
						{#each activeYears as year}
							<th class="px-1 py-2 text-dark-muted font-medium border-b border-dark-border text-center">
								<span class="inline-block -rotate-45 origin-center text-xs whitespace-nowrap">
									{year}
								</span>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each matrix as row}
						<tr class="hover:bg-dark-bg/50">
							<td class="sticky left-0 z-10 bg-dark-surface px-3 py-1.5 border-b border-dark-border/50 font-mono font-semibold text-dark-muted">
								{row.enteringRank}
							</td>
							{#each activeYears as year}
								<td class="px-0.5 py-1.5 border-b border-dark-border/50 text-center">
									{#if row.years[year]}
										<div
											class="w-5 h-5 mx-auto rounded-sm {row.years[year].madeWorlds ? 'bg-yellow-500' : 'bg-dark-border'}"
											title="Team {row.years[year].team} ({row.years[year].teamName}) — Entering rank: #{row.enteringRank} — Ending district rank: #{row.years[year].endingDistrictRank}{row.years[year].madeWorlds ? ' — Made Worlds' : ''}"
										></div>
									{:else}
										<div class="w-5 h-5 mx-auto rounded-sm bg-dark-bg/50"></div>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
