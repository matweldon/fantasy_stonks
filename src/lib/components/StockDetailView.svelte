<script lang="ts">
	import { onMount } from 'svelte';
	import type { PriceSnapshot, StockQuote } from '$lib/types';
	import { formatCurrency, formatPercent, getGainColorClass } from '$lib/utils/calculations';
	import { Chart, registerables } from 'chart.js';

	Chart.register(...registerables);

	interface Props {
		symbol: string;
		quote: StockQuote | null;
		priceHistory: PriceSnapshot[];
		onClose: () => void;
	}

	let { symbol, quote, priceHistory, onClose }: Props = $props();

	let chartCanvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		if (chartCanvas && priceHistory.length > 0) {
			createChart();
		}

		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});

	function createChart() {
		if (chart) {
			chart.destroy();
		}

		const ctx = chartCanvas.getContext('2d');
		if (!ctx) return;

		// Sort by date
		const sorted = [...priceHistory].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);

		const labels = sorted.map((snap) =>
			new Date(snap.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
		);
		const prices = sorted.map((snap) => snap.price);

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Price',
						data: prices,
						borderColor: '#4a90e2',
						backgroundColor: 'rgba(74, 144, 226, 0.1)',
						borderWidth: 2,
						fill: true,
						tension: 0.4,
						pointRadius: 3,
						pointHoverRadius: 6
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							label: (context) => `Price: ${formatCurrency(context.parsed.y)}`
						}
					}
				},
				scales: {
					y: {
						beginAtZero: false,
						ticks: {
							callback: (value) => formatCurrency(Number(value))
						}
					}
				}
			}
		});
	}
</script>

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-large" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2>{symbol}</h2>
			<button class="close-btn" onclick={onClose}>×</button>
		</div>

		{#if quote}
			<div class="quote-section">
				<div class="current-price">
					<div class="price">{formatCurrency(quote.price)}</div>
					<div class="change {getGainColorClass(quote.change)}">
						{formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
					</div>
				</div>

				<div class="quote-grid">
					<div class="quote-item">
						<span class="label">Open</span>
						<span class="value">{formatCurrency(quote.open)}</span>
					</div>
					<div class="quote-item">
						<span class="label">High</span>
						<span class="value">{formatCurrency(quote.high)}</span>
					</div>
					<div class="quote-item">
						<span class="label">Low</span>
						<span class="value">{formatCurrency(quote.low)}</span>
					</div>
					<div class="quote-item">
						<span class="label">Prev Close</span>
						<span class="value">{formatCurrency(quote.previousClose)}</span>
					</div>
					<div class="quote-item">
						<span class="label">Volume</span>
						<span class="value">{quote.volume.toLocaleString()}</span>
					</div>
					<div class="quote-item">
						<span class="label">Exchange</span>
						<span class="value">{quote.exchange}</span>
					</div>
				</div>
			</div>
		{/if}

		<div class="chart-section">
			<h3>Price History</h3>
			{#if priceHistory.length > 0}
				<div class="chart-container">
					<canvas bind:this={chartCanvas}></canvas>
				</div>
			{:else}
				<div class="no-data">No historical data available</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-large {
		background: white;
		border-radius: 12px;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid #e0e0e0;
	}

	h2 {
		margin: 0;
		color: #333;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 2rem;
		color: #999;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: #f0f0f0;
		color: #333;
	}

	.quote-section {
		padding: 2rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.current-price {
		margin-bottom: 1.5rem;
	}

	.price {
		font-size: 2.5rem;
		font-weight: 700;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.change {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.quote-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.quote-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.875rem;
		color: #666;
		font-weight: 500;
	}

	.value {
		font-size: 1rem;
		color: #333;
		font-weight: 600;
	}

	.chart-section {
		padding: 2rem;
	}

	h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #333;
	}

	.chart-container {
		height: 400px;
		position: relative;
	}

	.no-data {
		text-align: center;
		padding: 3rem;
		color: #888;
		background: #f8f9fa;
		border-radius: 8px;
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
		.modal-large {
			max-height: 95vh;
		}

		.price {
			font-size: 2rem;
		}

		.change {
			font-size: 1rem;
		}

		.quote-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.chart-container {
			height: 300px;
		}
	}
</style>
