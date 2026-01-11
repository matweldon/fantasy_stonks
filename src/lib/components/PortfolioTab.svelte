<script lang="ts">
	import type { Holding, PortfolioSummary } from '$lib/types';
	import { formatCurrency, formatPercent, getGainColorClass } from '$lib/utils/calculations';

	interface Props {
		summary: PortfolioSummary;
		holdings: Holding[];
		onSelectHolding: (symbol: string) => void;
	}

	let { summary, holdings, onSelectHolding }: Props = $props();
</script>

<div class="portfolio-tab">
	<div class="portfolio-summary">
		<h2>Portfolio Summary</h2>
		<div class="summary-grid">
			<div class="summary-card">
				<div class="summary-label">Total Value</div>
				<div class="summary-value">{formatCurrency(summary.totalValue)}</div>
			</div>

			<div class="summary-card">
				<div class="summary-label">Book Cost</div>
				<div class="summary-value">{formatCurrency(summary.totalBookCost)}</div>
			</div>

			<div class="summary-card">
				<div class="summary-label">Total Gain</div>
				<div class="summary-value {getGainColorClass(summary.totalGain)}">
					{formatCurrency(summary.totalGain)}
					<span class="percent">({formatPercent(summary.totalGainPercent)})</span>
				</div>
			</div>

			<div class="summary-card">
				<div class="summary-label">Day Gain</div>
				<div class="summary-value {getGainColorClass(summary.totalDayGain)}">
					{formatCurrency(summary.totalDayGain)}
					<span class="percent">({formatPercent(summary.totalDayGainPercent)})</span>
				</div>
			</div>

			<div class="summary-card">
				<div class="summary-label">Annualized Gain</div>
				<div class="summary-value {getGainColorClass(summary.annualizedGainPercent)}">
					{formatPercent(summary.annualizedGainPercent)}
				</div>
			</div>
		</div>
	</div>

	<div class="holdings-section">
		<h2>Holdings</h2>

		{#if holdings.length === 0}
			<div class="empty-state">
				<p>No holdings yet. Search for stocks and buy to get started!</p>
			</div>
		{:else}
			<div class="holdings-table">
				<div class="table-header">
					<div class="col-stock">Stock</div>
					<div class="col-qty">Qty</div>
					<div class="col-number">Book Cost</div>
					<div class="col-number">Value</div>
					<div class="col-number">Gain</div>
					<div class="col-number">Day Gain</div>
					<div class="col-number">Annual Gain</div>
				</div>

				{#each holdings as holding}
					<button class="holding-row" onclick={() => onSelectHolding(holding.symbol)}>
						<div class="col-stock">
							<div class="stock-symbol">{holding.symbol}</div>
							<div class="stock-name">{holding.name}</div>
						</div>
						<div class="col-qty">{holding.quantity.toLocaleString()}</div>
						<div class="col-number">{formatCurrency(holding.bookCost)}</div>
						<div class="col-number">{formatCurrency(holding.currentValue)}</div>
						<div class="col-number {getGainColorClass(holding.gain)}">
							{formatCurrency(holding.gain)}
							<span class="percent">({formatPercent(holding.gainPercent)})</span>
						</div>
						<div class="col-number {getGainColorClass(holding.dayGain)}">
							{formatCurrency(holding.dayGain)}
							<span class="percent">({formatPercent(holding.dayGainPercent)})</span>
						</div>
						<div class="col-number {getGainColorClass(holding.annualizedGainPercent)}">
							{formatPercent(holding.annualizedGainPercent)}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.portfolio-tab {
		padding: 1rem 0;
	}

	h2 {
		margin-bottom: 1rem;
		color: #333;
	}

	.portfolio-summary {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		color: white;
	}

	.portfolio-summary h2 {
		color: white;
		margin-bottom: 1.5rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.summary-card {
		background: rgba(255, 255, 255, 0.15);
		padding: 1rem;
		border-radius: 8px;
		backdrop-filter: blur(10px);
	}

	.summary-label {
		font-size: 0.875rem;
		opacity: 0.9;
		margin-bottom: 0.5rem;
	}

	.summary-value {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.summary-value .percent {
		font-size: 1rem;
		font-weight: 400;
		margin-left: 0.5rem;
	}

	.holdings-section {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #888;
	}

	.holdings-table {
		overflow-x: auto;
	}

	.table-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1.2fr 1.2fr 1.5fr 1.5fr 1.2fr;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: #f5f5f5;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.holding-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1.2fr 1.2fr 1.5fr 1.5fr 1.2fr;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		margin-bottom: 0.5rem;
		background: white;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s;
		width: 100%;
	}

	.holding-row:hover {
		background: #f8f9fa;
		border-color: #4a90e2;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.col-stock {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stock-symbol {
		font-weight: 700;
		color: #333;
	}

	.stock-name {
		font-size: 0.875rem;
		color: #666;
	}

	.col-qty,
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
		.summary-grid {
			grid-template-columns: 1fr;
		}

		.table-header,
		.holding-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.table-header {
			display: none;
		}

		.col-stock,
		.col-qty,
		.col-number {
			display: grid;
			grid-template-columns: 120px 1fr;
			gap: 0.5rem;
		}

		.col-stock::before,
		.col-qty::before,
		.col-number::before {
			content: attr(data-label);
			font-weight: 600;
			color: #666;
		}
	}
</style>
