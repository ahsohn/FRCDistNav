<script>
	import DataTable from '$lib/components/DataTable.svelte';
	import { findEventTwins, getAllEventPairings } from '$lib/analysis.js';

	export let data;

	let activeTab = 'combinations';
	let selectedTeam = null;
	let selectedPairing = null;

	$: teams = Object.entries(data.districtData.teams || {}).map(([num, info]) => ({
		number: parseInt(num, 10),
		...info
	})).sort((a, b) => a.number - b.number);

	$: allPairings = getAllEventPairings(data.districtData)
		.sort((a, b) => b.teams.length - a.teams.length);

	$: eventTwinsResult = selectedTeam
		? findEventTwins(data.districtData, selectedTeam)
		: null;

	$: twinsTableData = eventTwinsResult?.twins.map(teamNum => {
		const teamInfo = data.districtData.teams[teamNum] || {};
		const champRank = data.districtData.championship?.rankings?.find(r => r.team === teamNum);
		return {
			number: teamNum,
			name: teamInfo.name || `Team ${teamNum}`,
			champRank: champRank?.rank || null
		};
	}) || [];

	$: pairingTableData = selectedPairing?.teams.map(teamNum => {
		const teamInfo = data.districtData.teams[teamNum] || {};
		const champRank = data.districtData.championship?.rankings?.find(r => r.team === teamNum);
		return {
			number: teamNum,
			name: teamInfo.name || `Team ${teamNum}`,
			champRank: champRank?.rank || null
		};
	}) || [];

	const teamColumns = [
		{ key: 'number', label: 'Team', sortable: true },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'champRank', label: 'Champ Rank', sortable: true }
	];

	function selectTeamFromTable(row) {
		selectedTeam = row.number;
		activeTab = 'byteam';
	}
</script>

<svelte:head>
	<title>Event Twins | {data.districtInfo?.name} {data.year}</title>
</svelte:head>

<div>
	<!-- Tab toggle -->
	<div class="flex gap-2 mb-6">
		<button
			class="tab {activeTab === 'combinations' ? 'tab-active' : 'tab-inactive'}"
			on:click={() => activeTab = 'combinations'}
		>
			All Combinations
		</button>
		<button
			class="tab {activeTab === 'byteam' ? 'tab-active' : 'tab-inactive'}"
			on:click={() => activeTab = 'byteam'}
		>
			By Team
		</button>
	</div>

	{#if activeTab === 'combinations'}
		<!-- All Combinations View -->
		<div class="card">
			<h2 class="text-xl font-semibold mb-4">Event Pairings</h2>
			<p class="text-dark-muted mb-4">All unique combinations of 2 events and the teams that attended both</p>

			<div class="space-y-2">
				{#each allPairings as pairing}
					<button
						class="w-full p-4 bg-dark-bg rounded-lg text-left hover:bg-dark-border transition-colors
							{selectedPairing === pairing ? 'ring-2 ring-blue-500' : ''}"
						on:click={() => selectedPairing = selectedPairing === pairing ? null : pairing}
					>
						<div class="flex justify-between items-center">
							<div>
								<div class="font-medium">{pairing.eventNames.join(' + ')}</div>
							</div>
							<div class="text-dark-muted">
								{pairing.teams.length} teams
							</div>
						</div>
					</button>
				{/each}
			</div>

			{#if selectedPairing}
				<div class="mt-6">
					<h3 class="text-lg font-semibold mb-3">
						Teams at {selectedPairing.eventNames.join(' + ')}
					</h3>
					<DataTable
						data={pairingTableData}
						columns={teamColumns}
						onRowClick={selectTeamFromTable}
					/>
				</div>
			{/if}
		</div>

	{:else}
		<!-- By Team View -->
		<div class="card">
			<h2 class="text-xl font-semibold mb-4">Find Event Twins</h2>

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

			{#if eventTwinsResult}
				<div class="mb-6 p-4 bg-dark-bg rounded-lg">
					<div class="text-dark-muted text-sm mb-2">Team {selectedTeam} attended:</div>
					<div class="flex flex-wrap gap-2">
						{#each eventTwinsResult.events as event}
							<span class="px-3 py-1 bg-dark-surface rounded-full text-sm">
								{event.name}
							</span>
						{/each}
					</div>
				</div>

				<h3 class="text-lg font-semibold mb-3">
					Event Twins ({twinsTableData.length})
				</h3>

				{#if twinsTableData.length > 0}
					<DataTable
						data={twinsTableData}
						columns={teamColumns}
						onRowClick={(row) => selectedTeam = row.number}
					/>
				{:else}
					<p class="text-dark-muted">No other teams attended both of these events.</p>
				{/if}
			{/if}
		</div>
	{/if}
</div>
