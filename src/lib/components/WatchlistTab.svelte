<script lang="ts">
	import type { WatchlistItem } from '$lib/types';
	import { formatCurrency, formatPercent, getGainColorClass } from '$lib/utils/calculations';

	interface Props {
		watchlist: WatchlistItem[];
		onSelectStock: (symbol: string) => void;
		onRemove: (symbol: string) => void;
	}

	let { watchlist, onSelectStock, onRemove }: Props = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="watchlist-tab">
	<h2>Watchlist</h2>

	{#if watchlist.length === 0}
		<div class="empty-state">
			<p>Your watchlist is empty. Search for stocks and add them to start tracking!</p>
		</div>
	{:else}
		<div class="watchlist-table">
			<div class="table-header">
				<div class="col-stock">Stock</div>
				<div class="col-date">Date Added</div>
				<div class="col-number">Price When Added</div>
				<div class="col-number">Current Price</div>
				<div class="col-number">Gain Since Added</div>
				<div class="col-number">Day Gain</div>
				<div class="col-number">Annual Gain</div>
				<div class="col-actions">Actions</div>
			</div>

			{#each watchlist as item}
				<div class="watchlist-row">
					<button class="col-stock clickable" onclick={() => onSelectStock(item.symbol)}>
						<div class="stock-symbol">{item.symbol}</div>
						<div class="stock-name">{item.name}</div>
					</button>
					<div class="col-date">{formatDate(item.dateAdded)}</div>
					<div class="col-number">{formatCurrency(item.priceWhenAdded)}</div>
					<div class="col-number">{formatCurrency(item.currentPrice)}</div>
					<div class="col-number {getGainColorClass(item.gainSinceAdded)}">
						{formatCurrency(item.gainSinceAdded)}
						<span class="percent">({formatPercent(item.gainSinceAddedPercent)})</span>
					</div>
					<div class="col-number {getGainColorClass(item.dayGain)}">
						{formatCurrency(item.dayGain)}
						<span class="percent">({formatPercent(item.dayGainPercent)})</span>
					</div>
					<div class="col-number {getGainColorClass(item.annualizedGainPercent)}">
						{formatPercent(item.annualizedGainPercent)}
					</div>
					<div class="col-actions">
						<button class="btn-remove" onclick={() => onRemove(item.symbol)}> Remove </button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.watchlist-tab {
		padding: 1rem 0;
	}

	h2 {
		margin-bottom: 1.5rem;
		color: #333;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 1rem;
		color: #888;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.watchlist-table {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
	}

	.table-header {
		display: grid;
		grid-template-columns: 2fr 1.2fr 1.2fr 1.2fr 1.5fr 1.5fr 1.2fr 1fr;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: #f5f5f5;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.watchlist-row {
		display: grid;
		grid-template-columns: 2fr 1.2fr 1.2fr 1.2fr 1.5fr 1.5fr 1.2fr 1fr;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		margin-bottom: 0.5rem;
		transition: all 0.2s;
		align-items: center;
	}

	.watchlist-row:hover {
		background: #f8f9fa;
		border-color: #4a90e2;
	}

	.col-stock {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.col-stock.clickable {
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		transition: opacity 0.2s;
	}

	.col-stock.clickable:hover {
		opacity: 0.7;
	}

	.stock-symbol {
		font-weight: 700;
		color: #333;
	}

	.stock-name {
		font-size: 0.875rem;
		color: #666;
	}

	.col-date,
	.col-number {
		display: flex;
		flex-direction: column;
		justify-content: center;
		font-variant-numeric: tabular-nums;
	}

	.col-number .percent {
		font-size: 0.85rem;
		margin-left: 0.25rem;
	}

	.col-actions {
		display: flex;
		justify-content: flex-end;
	}

	.btn-remove {
		padding: 0.5rem 1rem;
		background: #fee;
		color: #c33;
		border: 1px solid #fcc;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.btn-remove:hover {
		background: #fcc;
	}

	.positive {
		color: #10b981;
	}

	.negative {
		color: #ef4444;
	}

	.neutral {
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.table-header {
			display: none;
		}

		.watchlist-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.col-stock,
		.col-date,
		.col-number {
			display: grid;
			grid-template-columns: 140px 1fr;
			gap: 0.5rem;
		}

		.col-actions {
			justify-content: flex-start;
			margin-top: 0.5rem;
		}
	}
</style>
