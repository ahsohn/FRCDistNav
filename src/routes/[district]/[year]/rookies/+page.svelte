<script>
	import { onMount } from 'svelte';
	import { loadAllDistrictYears } from '$lib/data.js';
	import { buildRookieMatrix } from '$lib/rookies.js';

	export let data;

	let loading = true;
	let rookieMatrix = [];
	let filterText = '';
	let sortBy = 'year-desc';

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

		rookieMatrix = buildRookieMatrix(allYearsData);
		loading = false;
	});

	// Flatten all rookies for table/grid display
	$: allRookies = rookieMatrix.flatMap(yd =>
		yd.rookies.map(r => ({ ...r, year: yd.year }))
	);

	$: totalRookies = allRookies.length;

	// Stats
	$: totalRasEvent = allRookies.filter(r => r.wonRasAtEvent).length;
	$: totalDcmp = allRookies.filter(r => r.competedAtDcmp).length;
	$: totalRasDcmp = allRookies.filter(r => r.wonRasAtDcmp).length;

	$: filteredRookies = allRookies.filter(r => {
		if (!filterText) return true;
		const q = filterText.toLowerCase();
		return String(r.team).includes(q) || r.name.toLowerCase().includes(q);
	});

	function sortRookies(rookies, method) {
		const sorted = [...rookies];
		switch (method) {
			case 'year-desc':
				sorted.sort((a, b) => b.year - a.year || a.team - b.team);
				break;
			case 'year-asc':
				sorted.sort((a, b) => a.year - b.year || a.team - b.team);
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

	$: displayRookies = sortRookies(filteredRookies, sortBy);

	// Group by year for the grid view
	$: groupedByYear = (() => {
		const groups = {};
		for (const r of displayRookies) {
			if (!groups[r.year]) groups[r.year] = [];
			groups[r.year].push(r);
		}
		// Return sorted year keys based on sort direction
		const years = Object.keys(groups).map(Number);
		if (sortBy === 'year-asc') {
			years.sort((a, b) => a - b);
		} else {
			years.sort((a, b) => b - a);
		}
		return years.map(y => ({ year: y, rookies: groups[y] }));
	})();

	// Check if any award data exists
	$: hasAwardData = allRookies.some(r => r.wonRasAtEvent || r.wonRasAtDcmp);
</script>

<svelte:head>
	<title>Rookies | {districtInfo?.name} {currentYear}</title>
</svelte:head>

<div>
	{#if loading}
		<div class="card">
			<p class="text-dark-muted">Loading {availableYears.length} years of data...</p>
		</div>
	{:else if allRookies.length === 0}
		<div class="card">
			<p class="text-dark-muted">No rookie data available for this district.</p>
		</div>
	{:else}
		<!-- Summary -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
			<div class="card">
				<div class="text-dark-muted text-sm uppercase tracking-wider">Total Rookies</div>
				<div class="text-3xl font-bold">{totalRookies}</div>
			</div>
			<div class="card">
				<div class="text-dark-muted text-sm uppercase tracking-wider">Event RAS Winners</div>
				<div class="text-3xl font-bold text-purple-400">{totalRasEvent}</div>
			</div>
			<div class="card">
				<div class="text-dark-muted text-sm uppercase tracking-wider">DCMP Competitors</div>
				<div class="text-3xl font-bold text-green-400">{totalDcmp}</div>
			</div>
			<div class="card">
				<div class="text-dark-muted text-sm uppercase tracking-wider">DCMP RAS Winners</div>
				<div class="text-3xl font-bold text-yellow-400">{totalRasDcmp}</div>
			</div>
		</div>

		<!-- Legend -->
		<div class="card mb-6">
			<div class="flex flex-wrap items-center gap-4">
				<span class="text-sm text-dark-muted">Legend:</span>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-dark-bg border border-dark-border"></div>
					<span class="text-sm">Rookie</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-purple-500/30 border border-purple-500"></div>
					<span class="text-sm">District Event Rookie All Star</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-green-600"></div>
					<span class="text-sm">Competed at DCMP</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-yellow-500"></div>
					<span class="text-sm">DCMP Rookie All Star</span>
				</div>
			</div>
			{#if !hasAwardData}
				<p class="text-sm text-dark-muted mt-2 italic">
					Note: Award data is not yet available. Run the fetch script to populate Rookie All Star award data.
				</p>
			{/if}
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
						<option value="year-desc">Year (Newest First)</option>
						<option value="year-asc">Year (Oldest First)</option>
						<option value="team">Team Number</option>
						<option value="name">Team Name</option>
					</select>
				</div>
			</div>
			<p class="text-sm text-dark-muted mt-2">
				Showing {displayRookies.length} of {totalRookies} rookies across {rookieMatrix.length} seasons
			</p>
		</div>

		<!-- Grid grouped by year -->
		{#each groupedByYear as yearGroup}
			<div class="card mb-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-lg font-semibold">{yearGroup.year}</h3>
					<span class="text-sm text-dark-muted">{yearGroup.rookies.length} rookies</span>
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
					{#each yearGroup.rookies as rookie}
						{@const bgClass = rookie.wonRasAtDcmp
							? 'bg-yellow-500/20 border-yellow-500'
							: rookie.competedAtDcmp && rookie.wonRasAtEvent
								? 'bg-green-600/20 border-green-500'
								: rookie.competedAtDcmp
									? 'bg-green-600/20 border-green-600'
									: rookie.wonRasAtEvent
										? 'bg-purple-500/20 border-purple-500'
										: 'bg-dark-bg border-dark-border'}
						<div
							class="p-2 rounded-lg border {bgClass} text-sm"
							title={buildTooltip(rookie)}
						>
							<div class="font-mono font-semibold">
								{rookie.team}
								{#if rookie.wonRasAtDcmp}
									<span class="text-yellow-400 ml-1" title="DCMP Rookie All Star">&#9733;</span>
								{/if}
								{#if rookie.wonRasAtEvent}
									<span class="text-purple-400 ml-0.5" title="District Event Rookie All Star">&#9734;</span>
								{/if}
							</div>
							<div class="text-dark-muted text-xs truncate">{rookie.name}</div>
							{#if rookie.competedAtDcmp || rookie.attendedDcmpForAward}
								<div class="mt-1">
									{#if rookie.competedAtDcmp}
										<span class="inline-block text-xs px-1.5 py-0.5 rounded bg-green-600/30 text-green-300">DCMP</span>
									{/if}
									{#if rookie.attendedDcmpForAward}
										<span class="inline-block text-xs px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300">DCMP (award only)</span>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<script context="module">
	function buildTooltip(rookie) {
		const parts = [`${rookie.team} ${rookie.name}`];
		if (rookie.wonRasAtEvent) parts.push('Won Rookie All Star at District Event');
		if (rookie.competedAtDcmp) parts.push('Competed at District Championship');
		if (rookie.attendedDcmpForAward) parts.push('Attended DCMP for RAS award (did not compete in matches)');
		if (rookie.wonRasAtDcmp) parts.push('Won Rookie All Star at District Championship');
		return parts.join('\n');
	}
</script>
