<script>
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	export let data;

	$: currentPath = $page.url.pathname;
	$: basePath = `${base}/${data.district}/${data.year}`;
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="bg-dark-surface border-b border-dark-border">
		<div class="max-w-6xl mx-auto px-4 py-4">
			<!-- Breadcrumb -->
			<nav class="text-sm text-dark-muted mb-2">
				<a href="{base}/" class="hover:text-dark-text">Home</a>
				<span class="mx-2">→</span>
				<span class="text-dark-text">{data.districtInfo?.name || data.district} {data.year}</span>
			</nav>

			<!-- Title and year toggle -->
			<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<h1 class="text-2xl font-bold">
					{data.districtInfo?.name || data.district} {data.year}
				</h1>

				<div class="flex gap-1">
					{#each data.availableYears.slice(0, 5) as year}
						<a
							href="{base}/{data.district}/{year}"
							class="px-3 py-1 rounded text-sm {year === data.year
								? 'bg-blue-600 text-white'
								: 'bg-dark-bg hover:bg-dark-border text-dark-muted'}"
						>
							{year}
						</a>
					{/each}
				</div>
			</div>

			<!-- Nav tabs -->
			<nav class="flex gap-4 mt-4">
				<a
					href={basePath}
					class="tab {currentPath === basePath ? 'tab-active' : 'tab-inactive'}"
				>
					Overview
				</a>
				<a
					href="{basePath}/event-twins"
					class="tab {currentPath.includes('event-twins') ? 'tab-active' : 'tab-inactive'}"
				>
					Event Twins
				</a>
				<a
					href="{basePath}/championships"
					class="tab {currentPath.includes('championships') ? 'tab-active' : 'tab-inactive'}"
				>
					Championships
				</a>
				<a
					href="{basePath}/championship-streaks"
					class="tab {currentPath.includes('championship-streaks') ? 'tab-active' : 'tab-inactive'}"
				>
					Streaks
				</a>
				<a
					href="{basePath}/qualification-streaks"
					class="tab {currentPath.includes('qualification-streaks') ? 'tab-active' : 'tab-inactive'}"
				>
					Qualification Grid
				</a>
			</nav>
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-6xl mx-auto px-4 py-6">
		<slot />
	</main>
</div>
