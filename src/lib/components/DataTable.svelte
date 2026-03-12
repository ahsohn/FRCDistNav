<script>
	export let data = [];
	export let columns = [];
	export let onRowClick = null;

	let sortColumn = null;
	let sortDirection = 'asc';

	function handleSort(column) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	$: sortedData = (() => {
		if (!sortColumn) return data;

		const col = columns.find(c => c.key === sortColumn);
		if (!col) return data;

		return [...data].sort((a, b) => {
			const aVal = col.getValue ? col.getValue(a) : a[col.key];
			const bVal = col.getValue ? col.getValue(b) : b[col.key];

			if (aVal === bVal) return 0;
			if (aVal === null || aVal === undefined) return 1;
			if (bVal === null || bVal === undefined) return -1;

			const comparison = aVal < bVal ? -1 : 1;
			return sortDirection === 'asc' ? comparison : -comparison;
		});
	})();
</script>

<div class="overflow-x-auto">
	<table class="data-table">
		<thead>
			<tr>
				{#each columns as column}
					<th
						on:click={() => column.sortable !== false && handleSort(column.key)}
						class="{column.sortable !== false ? 'cursor-pointer' : ''}"
					>
						{column.label}
						{#if sortColumn === column.key}
							<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedData as row}
				<tr
					class="{onRowClick ? 'cursor-pointer' : ''}"
					on:click={() => onRowClick && onRowClick(row)}
				>
					{#each columns as column}
						<td>
							{#if column.render}
								{@html column.render(row)}
							{:else if column.getValue}
								{column.getValue(row)}
							{:else}
								{row[column.key] ?? '-'}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if sortedData.length === 0}
	<p class="text-dark-muted text-center py-8">No data available</p>
{/if}
