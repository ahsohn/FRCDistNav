<script>
	import { base } from '$app/paths';
	export let data;

	let selectedDistrict = null;
	let selectedYear = data.latestYear;

	$: availableYears = selectedDistrict
		? data.districts.find(d => d.key === selectedDistrict)?.years || []
		: [...new Set(data.districts.flatMap(d => d.years))].sort((a, b) => b - a);
</script>

<svelte:head>
	<title>FRC District Navigator</title>
</svelte:head>

<main class="max-w-4xl mx-auto p-8">
	<h1 class="text-4xl font-bold mb-2">FRC District Navigator</h1>
	<p class="text-dark-muted mb-8">Explore FRC district history, event patterns, and championship streaks</p>

	<div class="card mb-6">
		<h2 class="text-xl font-semibold mb-4">Select a District</h2>
		<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
			{#each data.districts as district}
				<button
					class="p-3 rounded-lg border text-left transition-colors {selectedDistrict === district.key
						? 'bg-blue-600 border-blue-500 text-white'
						: 'border-dark-border hover:border-blue-500'}"
					on:click={() => {
						selectedDistrict = district.key;
						if (!district.years.includes(selectedYear)) {
							selectedYear = district.years[0];
						}
					}}
				>
					<div class="font-medium">{district.name}</div>
					<div class="text-sm opacity-70">{district.key.toUpperCase()}</div>
				</button>
			{/each}
		</div>
	</div>

	<div class="card mb-6">
		<h2 class="text-xl font-semibold mb-4">Select Year</h2>
		<select
			bind:value={selectedYear}
			class="w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text"
		>
			{#each availableYears as year}
				<option value={year}>{year}</option>
			{/each}
		</select>
	</div>

	{#if selectedDistrict && selectedYear}
		<a
			href="{base}/{selectedDistrict}/{selectedYear}"
			class="btn btn-primary inline-block text-center w-full md:w-auto"
		>
			Explore {data.districts.find(d => d.key === selectedDistrict)?.name} {selectedYear} →
		</a>
	{:else}
		<button class="btn btn-primary opacity-50 cursor-not-allowed w-full md:w-auto" disabled>
			Select a district to continue
		</button>
	{/if}
</main>
