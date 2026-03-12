<script>
	import DataTable from '$lib/components/DataTable.svelte';

	export let data;

	let activeTab = 'all';
	let selectedTeam = null;

	$: championship = data.districtData.championship;
	$: rankings = championship?.rankings || [];

	$: allTeamsData = rankings.map(r => {
		const teamInfo = data.districtData.teams[r.team] || {};
		return {
			number: r.team,
			name: teamInfo.name || `Team ${r.team}`,
			rank: r.rank,
			record: r.record,
			playoff: r.playoff || '-',
			worlds: r.advancedToWorlds ? 'Yes' : 'No'
		};
	});

	$: selectedTeamData = selectedTeam
		? rankings.find(r => r.team === selectedTeam)
		: null;

	$: selectedTeamInfo = selectedTeam
		? data.districtData.teams[selectedTeam] || {}
		: null;

	const columns = [
		{ key: 'rank', label: 'Rank', sortable: true },
		{ key: 'number', label: 'Team', sortable: true },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'record', label: 'Record', sortable: false },
		{ key: 'playoff', label: 'Playoff', sortable: true },
		{ key: 'worlds', label: 'Worlds', sortable: true }
	];

	$: teams = Object.entries(data.districtData.teams || {}).map(([num, info]) => ({
		number: parseInt(num, 10),
		...info
	})).sort((a, b) => a.number - b.number);
</script>

<svelte:head>
	<title>Championship History | {data.districtInfo?.name} {data.year}</title>
</svelte:head>

<div>
	{#if !championship}
		<div class="card">
			<p class="text-dark-muted">No championship data available for this district/year.</p>
		</div>
	{:else}
		<!-- Championship header -->
		<div class="card mb-6">
			<h2 class="text-xl font-semibold">{championship.name}</h2>
			<p class="text-dark-muted">{championship.startDate}</p>
		</div>

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
			<!-- All Teams View -->
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">Championship Rankings</h3>
				<DataTable
					data={allTeamsData}
					columns={columns}
					onRowClick={(row) => {
						selectedTeam = row.number;
						activeTab = 'byteam';
					}}
				/>
			</div>

		{:else}
			<!-- By Team View -->
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">Team Championship Profile</h3>

				<div class="mb-6">
					<label for="team-select" class="block text-sm text-dark-muted mb-2">Select a team</label>
					<select
						id="team-select"
						bind:value={selectedTeam}
						class="w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text"
					>
						<option value={null}>Choose a team...</option>
						{#each teams as team}
							<option value={team.number}>{team.number} - {team.name}</option>
						{/each}
					</select>
				</div>

				{#if selectedTeamData}
					<div class="space-y-4">
						<!-- Team header -->
						<div class="p-4 bg-dark-bg rounded-lg">
							<h4 class="text-xl font-bold">
								Team {selectedTeam} - {selectedTeamInfo?.name || 'Unknown'}
							</h4>
							{#if selectedTeamInfo?.rookie_year}
								<p class="text-dark-muted">Rookie Year: {selectedTeamInfo.rookie_year}</p>
							{/if}
						</div>

						<!-- Stats grid -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-3xl font-bold">{selectedTeamData.rank}</div>
								<div class="text-dark-muted text-sm">Rank</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-xl font-bold">{selectedTeamData.record}</div>
								<div class="text-dark-muted text-sm">Record</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-xl font-bold">{selectedTeamData.playoff || '-'}</div>
								<div class="text-dark-muted text-sm">Playoff</div>
							</div>
							<div class="p-4 bg-dark-bg rounded-lg text-center">
								<div class="text-xl font-bold {selectedTeamData.advancedToWorlds ? 'text-green-400' : ''}">
									{selectedTeamData.advancedToWorlds ? 'Yes' : 'No'}
								</div>
								<div class="text-dark-muted text-sm">Worlds</div>
							</div>
						</div>

						<!-- Note about multi-year history -->
						<div class="p-4 bg-dark-surface border border-dark-border rounded-lg">
							<p class="text-dark-muted text-sm">
								Note: Multi-year championship history (streaks, historical results) will be available
								once data is loaded for multiple years. Currently showing {data.year} only.
							</p>
						</div>
					</div>
				{:else if selectedTeam}
					<p class="text-dark-muted">Team {selectedTeam} did not qualify for the championship.</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>
