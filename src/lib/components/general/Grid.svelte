<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createGrid,
		ModuleRegistry,
		ClientSideRowModelModule,
		type GridOptions,
		themeQuartz,
		PaginationModule,
		type GridApi,
		QuickFilterModule,
		ValidationModule
	} from 'ag-grid-community';

	// Register AG Grid Modules
	ModuleRegistry.registerModules([
		ClientSideRowModelModule,
		PaginationModule,
		QuickFilterModule,
		ValidationModule
	]);

	interface Props<T extends Record<string, unknown> = Record<string, unknown>> {
		columnDefs: {
			headerName: string;
			field: keyof T;
		}[];
		rowData: T[];
		classes: string;
	}

	let { columnDefs, rowData, classes }: Props = $props();

	// Create a custom dark theme using Theming API
	const darkTheme = themeQuartz.withParams({
		backgroundColor: '#212529',
		browserColorScheme: 'dark',
		chromeBackgroundColor: {
			ref: 'foregroundColor',
			mix: 0.07,
			onto: 'backgroundColor'
		},
		foregroundColor: '#FFF',
		headerFontSize: 14
	});

	let gridDiv: HTMLDivElement;
	let grid: GridApi;
	let filterText = '';

	const onFilterTextBoxChanged = () => {
		grid.setGridOption('quickFilterText', filterText);
		console.log('filtering');
	};

	onMount(() => {
		const gridOptions: GridOptions<any> = {
			theme: darkTheme, // Apply custom dark theme
			columnDefs,
			rowData,
			defaultColDef: {
				sortable: true,
				filter: true
			},
			pagination: true,
			paginationAutoPageSize: true
		};

		if (gridDiv) {
			grid = createGrid(gridDiv, gridOptions); // Create the grid with custom options
		}
	});
</script>

<!-- Grid Container -->
<div class="example-header">
	<span>Quick Filter:</span>
	<input
		type="text"
		id="filter-text-box"
		placeholder="Filter..."
		oninput={onFilterTextBoxChanged}
		value={filterText}
	/>
</div>
<div bind:this={gridDiv} class={classes}></div>
