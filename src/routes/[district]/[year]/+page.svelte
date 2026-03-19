<script>
	import { base } from '$app/paths';
	export let data;

	$: teamCount = Object.keys(data.districtData.teams || {}).length;
	$: eventCount = data.districtData.events?.length || 0;
	$: championship = data.districtData.championship;
</script>

<svelte:head>
	<title>{data.districtInfo?.name} {data.year} | FRC District Navigator</title>
</svelte:head>

<div class="grid gap-6">
	<!-- Summary cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="card">
			<div class="text-dark-muted text-sm uppercase tracking-wider">Teams</div>
			<div class="text-3xl font-bold">{teamCount}</div>
		</div>
		<div class="card">
			<div class="text-dark-muted text-sm uppercase tracking-wider">District Events</div>
			<div class="text-3xl font-bold">{eventCount}</div>
		</div>
		<div class="card">
			<div class="text-dark-muted text-sm uppercase tracking-wider">Championship</div>
			<div class="text-lg font-bold">{championship?.name || 'N/A'}</div>
		</div>
	</div>

	<!-- Events list -->
	<div class="card">
		<h2 class="text-xl font-semibold mb-4">District Events</h2>
		<div class="grid gap-2">
			{#each data.districtData.events || [] as event}
				<div class="flex justify-between items-center p-3 bg-dark-bg rounded-lg">
					<div>
						<div class="font-medium">{event.name}</div>
						<div class="text-sm text-dark-muted">{event.startDate}</div>
					</div>
					<div class="text-dark-muted">
						{event.teams.length} teams
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Analysis links -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<a href="{base}/{data.district}/{data.year}/event-twins" class="card hover:border-blue-500 transition-colors">
			<h3 class="text-lg font-semibold mb-2">Event Twins</h3>
			<p class="text-dark-muted">Find teams that attended the same two district events</p>
		</a>
		<a href="{base}/{data.district}/{data.year}/championships" class="card hover:border-blue-500 transition-colors">
			<h3 class="text-lg font-semibold mb-2">Championship History</h3>
			<p class="text-dark-muted">Explore qualification streaks, results, and Worlds advancement</p>
		</a>
		<a href="{base}/{data.district}/{data.year}/championship-streaks" class="card hover:border-blue-500 transition-colors">
			<h3 class="text-lg font-semibold mb-2">Championship Streaks</h3>
			<p class="text-dark-muted">View consecutive championship qualification streaks for all teams</p>
		</a>
		<a href="{base}/{data.district}/{data.year}/qualification-streaks" class="card hover:border-blue-500 transition-colors">
			<h3 class="text-lg font-semibold mb-2">Qualification Grid</h3>
			<p class="text-dark-muted">Year-by-year visualization of district championship qualifications and Worlds advancement</p>
		</a>
	</div>
</div>
