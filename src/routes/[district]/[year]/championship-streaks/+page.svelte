<script>
	import { onMount } from 'svelte';
	import { loadAllDistrictYears } from '$lib/data.js';
	import { calculateAllStreaks, getYearsWithChampionshipData } from '$lib/streaks.js';
	import DataTable from '$lib/components/DataTable.svelte';

	export let data;

	let loading = true;
	let streaksData = [];
	let activeTab = 'all';
	let selectedTeam = null;

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

		// Only use years that actually have championship data for streak calculation
		// This prevents penalizing teams for years where championships haven't happened yet
		const yearsWithChampionships = getYearsWithChampionshipData(allYearsData);
		streaksData = calculateAllStreaks(allYearsData, allTeams, yearsWithChampionships);
		loading = false;
	});

	$: selectedTeamData = selectedTeam
		? streaksData.find(s => s.team === selectedTeam)
		: null;

	const columns = [
		{ key: 'team', label: 'Team', sortable: true },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'currentStreak', label: 'Streak', sortable: true },
		{ key: 'status', label: 'Status', sortable: true },
		{ key: 'streakStart', label: 'Since', sortable: true }
	];

	$: tableData = streaksData.map(s => ({
		...s,
		status: s.currentStreak === 0
			? 'Never'
			: s.isActive
				? 'Active'
				: `Ended ${s.streakEnd}`
	}));
</script>

<svelte:head>
	<title>Championship Streaks | {districtInfo?.name} {currentYear}</title>
</svelte:head>

<div>
	{#if loading}
		<div class="card">
			<p class="text-dark-muted">Loading {availableYears.length} years of data...</p>
		</div>
	{:else if streaksData.length === 0}
		<div class="card">
			<p class="text-dark-muted">No championship data available for this district.</p>
		</div>
	{:else}
		<!-- Tab toggle -->
		<div class="flex gap-2 mb-6">
			<button
				class="tab {activeTab === 'all' ? 'tab-active' : 'tab-inactive'}"
				on:click={() => activeTab = 'all'}
			>
				All Teams
			</button>
			<button
				class="tab {activeTab === 'byteam' ? 'tab-active' : 'tab-inactive'}"
				on:click={() => activeTab = 'byteam'}
			>
				By Team
			</button>
		</div>

		{#if activeTab === 'all'}
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">Championship Qualifying Streaks</h3>
				<DataTable
					data={tableData}
					{columns}
					onRowClick={(row) => {
						selectedTeam = row.team;
						activeTab = 'byteam';
					}}
				/>
			</div>
		{:else}
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">Team Championship History</h3>

				<div class="mb-6">
					<label for="team-select" class="block text-sm text-dark-muted mb-2">Select a team</label>
					<select
						id="team-select"
						bind:value={selectedTeam}
						class="w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text"
					>
						<option value={null}>Choose a team...</option>
						{#each streaksData as team}
							<option value={team.team}>{team.team} - {team.name}</option>
						{/each}
					</select>
				</div>

				{#if selectedTeamData}
					<div class="space-y-4">
						<!-- Team header -->
						<div class="p-4 bg-dark-bg rounded-lg">
							<h4 class="text-xl font-bold">
								Team {selectedTeamData.team} - {selectedTeamData.name}
							</h4>
							{#if selectedTeamData.rookieYear}
								<p class="text-dark-muted">Rookie Year: {selectedTeamData.rookieYear}</p>
							{/if}
						</div>

						<!-- Stats grid -->
						<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-3xl font-bold">{selectedTeamData.currentStreak}</div>
								<div class="text-dark-muted text-sm">Current Streak</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-3xl font-bold">{selectedTeamData.totalQualifications}</div>
								<div class="text-dark-muted text-sm">Total Qualifications</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-xl font-bold {selectedTeamData.isActive ? 'text-green-400' : ''}">
									{selectedTeamData.isActive ? 'Active' : selectedTeamData.streakEnd ? `Ended ${selectedTeamData.streakEnd}` : 'Never'}
								</div>
								<div class="text-dark-muted text-sm">Status</div>
							</div>
						</div>

						<!-- Year-by-year timeline -->
						<div class="p-4 bg-dark-bg rounded-lg">
							<h5 class="font-semibold mb-3">Year-by-Year History</h5>
							<div class="flex flex-wrap gap-2">
								{#each availableYears.sort((a, b) => a - b) as year}
									<div
										class="px-3 py-1 rounded text-sm {selectedTeamData.qualifiedYears.includes(year) ? 'bg-green-600 text-white' : 'bg-dark-surface text-dark-muted'}"
									>
										{year}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
