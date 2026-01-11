<script lang="ts">
	import type { StockSearchResult } from '$lib/types';
	import { TwelveDataService } from '$lib/services/twelveData';
	import { apiKeys } from '$lib/stores/apiKeys';
	import { POPULAR_LSE_STOCKS } from '$lib/data/popularStocks';

	interface Props {
		onSelect: (result: StockSearchResult) => void;
	}

	let { onSelect }: Props = $props();

	let searchQuery = $state('');
	let searchResults = $state<StockSearchResult[]>([]);
	let isSearching = $state(false);
	let error = $state('');
	let showPopular = $state(true);

	let searchTimeout: NodeJS.Timeout;

	async function handleSearch() {
		if (!searchQuery.trim()) {
			searchResults = [];
			showPopular = true;
			return;
		}

		showPopular = false;
		isSearching = true;
		error = '';

		try {
			const keys = $apiKeys;
			if (!keys) {
				throw new Error('API keys not loaded');
			}

			const service = new TwelveDataService(keys.twelveDataApiKey);
			const results = await service.search(searchQuery, 'LSE');
			searchResults = results;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Search failed';
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	function handleInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(handleSearch, 500);
	}

	function selectStock(result: StockSearchResult) {
		onSelect(result);
		searchQuery = '';
		searchResults = [];
		showPopular = true;
	}
</script>

<div class="stock-search">
	<div class="search-box">
		<input
			type="text"
			bind:value={searchQuery}
			oninput={handleInput}
			placeholder="Search for stocks, ETFs, funds..."
			class="search-input"
		/>
		{#if isSearching}
			<div class="search-loader">Searching...</div>
		{/if}
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if showPopular && !searchQuery}
		<div class="popular-stocks">
			<h3>Popular London Stocks</h3>
			<div class="stock-list">
				{#each POPULAR_LSE_STOCKS as stock}
					<button class="stock-item" onclick={() => selectStock(stock)}>
						<div class="stock-symbol">{stock.symbol}</div>
						<div class="stock-name">{stock.name}</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if searchResults.length > 0}
		<div class="search-results">
			<div class="stock-list">
				{#each searchResults as result}
					<button class="stock-item" onclick={() => selectStock(result)}>
						<div class="stock-symbol">{result.symbol}</div>
						<div class="stock-name">{result.name}</div>
						<div class="stock-meta">{result.exchange} • {result.type}</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.stock-search {
		margin-bottom: 2rem;
	}

	.search-box {
		position: relative;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		box-sizing: border-box;
	}

	.search-input:focus {
		outline: none;
		border-color: #4a90e2;
	}

	.search-loader {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #777;
		font-size: 0.875rem;
	}

	.error {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: #fee;
		color: #c33;
		border-radius: 4px;
	}

	.popular-stocks,
	.search-results {
		margin-top: 1rem;
	}

	.popular-stocks h3 {
		font-size: 1rem;
		color: #666;
		margin-bottom: 0.75rem;
		font-weight: 600;
	}

	.stock-list {
		display: grid;
		gap: 0.5rem;
	}

	.stock-item {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #f8f9fa;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s;
	}

	.stock-item:hover {
		background: #e8f4fd;
		border-color: #4a90e2;
	}

	.stock-symbol {
		font-weight: 700;
		color: #333;
		font-size: 0.95rem;
	}

	.stock-name {
		color: #555;
		font-size: 0.9rem;
	}

	.stock-meta {
		color: #888;
		font-size: 0.8rem;
	}
</style>
