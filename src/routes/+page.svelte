<script lang="ts">
	import { onMount } from 'svelte';
	import { isUnlocked, apiKeys } from '$lib/stores/apiKeys';
	import { GoogleSheetsService } from '$lib/services/googleSheets';
	import { TwelveDataService } from '$lib/services/twelveData';
	import {
		buildHoldings,
		calculatePortfolioSummary,
		enrichWatchlist
	} from '$lib/utils/calculations';
	import type {
		Transaction,
		WatchlistItem,
		Holding,
		PortfolioSummary,
		StockSearchResult,
		StockQuote,
		PriceSnapshot
	} from '$lib/types';

	import PasswordModal from '$lib/components/PasswordModal.svelte';
	import StockSearch from '$lib/components/StockSearch.svelte';
	import PortfolioTab from '$lib/components/PortfolioTab.svelte';
	import WatchlistTab from '$lib/components/WatchlistTab.svelte';
	import BuyStockModal from '$lib/components/BuyStockModal.svelte';
	import StockDetailView from '$lib/components/StockDetailView.svelte';

	let activeTab = $state<'portfolio' | 'watchlist'>('portfolio');
	let isLoading = $state(false);
	let error = $state('');

	// Data
	let transactions = $state<Transaction[]>([]);
	let watchlist = $state<WatchlistItem[]>([]);
	let holdings = $state<Holding[]>([]);
	let summary = $state<PortfolioSummary>({
		totalValue: 0,
		totalBookCost: 0,
		totalGain: 0,
		totalGainPercent: 0,
		totalDayGain: 0,
		totalDayGainPercent: 0,
		annualizedGainPercent: 0
	});

	// Modals
	let buyStockModalData = $state<{ stock: StockSearchResult; quote: StockQuote | null } | null>(
		null
	);
	let detailViewData = $state<{
		symbol: string;
		quote: StockQuote | null;
		history: PriceSnapshot[];
	} | null>(null);

	let sheetsService: GoogleSheetsService | null = null;
	let twelveDataService: TwelveDataService | null = null;

	$effect(() => {
		if ($isUnlocked && $apiKeys) {
			sheetsService = new GoogleSheetsService($apiKeys.googleSheetsApiKey, $apiKeys.googleSheetId);
			twelveDataService = new TwelveDataService($apiKeys.twelveDataApiKey);
			loadData();
		}
	});

	async function loadData() {
		if (!sheetsService || !twelveDataService) return;

		isLoading = true;
		error = '';

		try {
			// Initialize sheets if needed
			await sheetsService.initializeSheets();

			// Load transactions and watchlist
			const [txns, wl] = await Promise.all([
				sheetsService.getTransactions(),
				sheetsService.getWatchlist()
			]);

			transactions = txns;
			watchlist = wl;

			// Get all unique symbols
			const portfolioSymbols = new Set(txns.map((t) => t.symbol));
			const watchlistSymbols = new Set(wl.map((w) => w.symbol));
			const allSymbols = [...portfolioSymbols, ...watchlistSymbols];

			if (allSymbols.length > 0) {
				// Fetch current prices
				const quotes = await twelveDataService.getQuotes(allSymbols);

				// Build price map
				const priceMap = new Map<string, { price: number; previousClose: number }>();
				for (const [symbol, quote] of quotes) {
					priceMap.set(symbol, { price: quote.price, previousClose: quote.previousClose });
				}

				// Calculate holdings and summary
				holdings = buildHoldings(txns, priceMap);
				summary = calculatePortfolioSummary(holdings);

				// Enrich watchlist
				watchlist = enrichWatchlist(wl, priceMap);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load data';
			console.error('Load error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function handleStockSelect(result: StockSearchResult, action: 'buy' | 'watch') {
		if (!twelveDataService) return;

		try {
			const quote = await twelveDataService.getQuote(result.symbol, result.exchange);

			if (action === 'buy') {
				buyStockModalData = { stock: result, quote };
			} else {
				await handleAddToWatchlist(result, quote);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to get stock quote';
		}
	}

	async function handleBuyStock(quantity: number, totalCost: number) {
		if (!sheetsService || !buyStockModalData) return;

		isLoading = true;
		try {
			const { stock, quote } = buyStockModalData;
			if (!quote) throw new Error('No quote available');

			await sheetsService.addTransaction({
				symbol: stock.symbol,
				name: stock.name,
				type: 'BUY',
				quantity,
				pricePerShare: quote.price,
				totalCost,
				date: new Date().toISOString(),
				exchange: stock.exchange
			});

			// Save price snapshot
			await sheetsService.savePriceSnapshot({
				symbol: stock.symbol,
				price: quote.price,
				date: new Date().toISOString(),
				open: quote.open,
				high: quote.high,
				low: quote.low,
				close: quote.price,
				volume: quote.volume
			});

			buyStockModalData = null;
			await loadData();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to buy stock';
		} finally {
			isLoading = false;
		}
	}

	async function handleAddToWatchlist(stock: StockSearchResult, quote: StockQuote) {
		if (!sheetsService) return;

		isLoading = true;
		try {
			await sheetsService.addToWatchlist(stock.symbol, stock.name, quote.price, stock.exchange);
			await loadData();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add to watchlist';
		} finally {
			isLoading = false;
		}
	}

	async function handleRemoveFromWatchlist(symbol: string) {
		if (!sheetsService) return;

		isLoading = true;
		try {
			await sheetsService.removeFromWatchlist(symbol);
			await loadData();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to remove from watchlist';
		} finally {
			isLoading = false;
		}
	}

	async function handleShowDetail(symbol: string) {
		if (!twelveDataService || !sheetsService) return;

		isLoading = true;
		try {
			const [quote, history] = await Promise.all([
				twelveDataService.getQuote(symbol),
				sheetsService.getPriceHistory(symbol)
			]);

			detailViewData = { symbol, quote, history };
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load stock details';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Fantasy Stonks - Portfolio Tracker</title>
</svelte:head>

{#if !$isUnlocked}
	<PasswordModal />
{:else}
	<div class="app">
		<header class="app-header">
			<h1>💰 Fantasy Stonks</h1>
			<p class="tagline">Track your fantasy stock portfolio</p>
		</header>

		<main class="app-main">
			{#if error}
				<div class="error-banner">
					{error}
					<button onclick={() => (error = '')}>×</button>
				</div>
			{/if}

			{#if isLoading}
				<div class="loading-banner">Loading...</div>
			{/if}

			<div class="search-section">
				<StockSearch
					onSelect={async (result) => {
						// Show action buttons
						const action = confirm(`Add ${result.symbol} to:\nOK = Buy\nCancel = Watchlist`)
							? 'buy'
							: 'watch';
						await handleStockSelect(result, action);
					}}
				/>
			</div>

			<div class="tabs">
				<button
					class="tab"
					class:active={activeTab === 'portfolio'}
					onclick={() => (activeTab = 'portfolio')}
				>
					Portfolio
				</button>
				<button
					class="tab"
					class:active={activeTab === 'watchlist'}
					onclick={() => (activeTab = 'watchlist')}
				>
					Watchlist
				</button>
			</div>

			<div class="tab-content">
				{#if activeTab === 'portfolio'}
					<PortfolioTab {summary} {holdings} onSelectHolding={handleShowDetail} />
				{:else}
					<WatchlistTab
						{watchlist}
						onSelectStock={handleShowDetail}
						onRemove={handleRemoveFromWatchlist}
					/>
				{/if}
			</div>
		</main>

		<footer class="app-footer">
			<p>Fantasy Stonks - For entertainment purposes only</p>
		</footer>
	</div>

	{#if buyStockModalData}
		<BuyStockModal
			stock={buyStockModalData.stock}
			quote={buyStockModalData.quote}
			onBuy={handleBuyStock}
			onClose={() => (buyStockModalData = null)}
		/>
	{/if}

	{#if detailViewData}
		<StockDetailView
			symbol={detailViewData.symbol}
			quote={detailViewData.quote}
			priceHistory={detailViewData.history}
			onClose={() => (detailViewData = null)}
		/>
	{/if}
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
			sans-serif;
		background: #f5f7fa;
		color: #333;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem 1rem;
		text-align: center;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.app-header h1 {
		margin: 0;
		font-size: 2.5rem;
		font-weight: 700;
	}

	.tagline {
		margin: 0.5rem 0 0 0;
		opacity: 0.9;
		font-size: 1.1rem;
	}

	.app-main {
		flex: 1;
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem 1rem;
		width: 100%;
	}

	.error-banner {
		background: #fee;
		color: #c33;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.error-banner button {
		background: none;
		border: none;
		color: #c33;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
	}

	.loading-banner {
		background: #e8f4fd;
		color: #4a90e2;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		text-align: center;
		font-weight: 600;
	}

	.search-section {
		margin-bottom: 2rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #e0e0e0;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		color: #666;
		transition: all 0.2s;
		margin-bottom: -2px;
	}

	.tab:hover {
		color: #4a90e2;
	}

	.tab.active {
		color: #4a90e2;
		border-bottom-color: #4a90e2;
	}

	.tab-content {
		animation: fadeIn 0.3s;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.app-footer {
		background: #2c3e50;
		color: white;
		padding: 1.5rem;
		text-align: center;
		margin-top: 3rem;
	}

	.app-footer p {
		margin: 0;
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.app-header h1 {
			font-size: 2rem;
		}

		.tagline {
			font-size: 1rem;
		}

		.app-main {
			padding: 1rem;
		}
	}
</style>