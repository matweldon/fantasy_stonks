<script lang="ts">
	import type { StockSearchResult, StockQuote } from '$lib/types';
	import { formatCurrency } from '$lib/utils/calculations';

	interface Props {
		stock: StockSearchResult | null;
		quote: StockQuote | null;
		onBuy: (quantity: number, totalCost: number) => void;
		onClose: () => void;
	}

	let { stock, quote, onBuy, onClose }: Props = $props();

	let buyAmount = $state('');
	let quantity = $state(0);
	let totalCost = $state(0);
	let error = $state('');

	// Calculate quantity when buy amount changes
	function handleAmountChange() {
		error = '';
		const amount = parseFloat(buyAmount);

		if (isNaN(amount) || amount <= 0) {
			quantity = 0;
			totalCost = 0;
			return;
		}

		if (!quote) {
			error = 'Unable to get stock price';
			return;
		}

		quantity = Math.floor(amount / quote.price);
		totalCost = quantity * quote.price;
	}

	function handleBuy() {
		if (quantity <= 0) {
			error = 'Please enter a valid amount';
			return;
		}

		if (!quote) {
			error = 'Unable to get stock price';
			return;
		}

		onBuy(quantity, totalCost);
	}
</script>

{#if stock}
	<div class="modal-overlay" onclick={onClose}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2>Buy {stock.symbol}</h2>

			<div class="stock-info">
				<div class="info-row">
					<span class="label">Name:</span>
					<span class="value">{stock.name}</span>
				</div>
				<div class="info-row">
					<span class="label">Exchange:</span>
					<span class="value">{stock.exchange}</span>
				</div>
				{#if quote}
					<div class="info-row">
						<span class="label">Current Price:</span>
						<span class="value price">{formatCurrency(quote.price)}</span>
					</div>
				{/if}
			</div>

			<div class="form-group">
				<label for="buyAmount">Amount to Invest (£)</label>
				<input
					type="number"
					id="buyAmount"
					bind:value={buyAmount}
					oninput={handleAmountChange}
					placeholder="Enter amount in GBP"
					step="0.01"
					min="0"
				/>
			</div>

			{#if quantity > 0}
				<div class="calculation">
					<p>
						You will buy <strong>{quantity} shares</strong> for approximately
						<strong>{formatCurrency(totalCost)}</strong>
					</p>
				</div>
			{/if}

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<div class="button-group">
				<button class="btn-secondary" onclick={onClose}>Cancel</button>
				<button class="btn-primary" onclick={handleBuy} disabled={quantity <= 0}>
					Buy {quantity > 0 ? `${quantity} Shares` : ''}
				</button>
			</div>
		</div>
	</div>
{/if}

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
	}

	.modal {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #333;
	}

	.stock-info {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid #e0e0e0;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.label {
		color: #666;
		font-weight: 500;
	}

	.value {
		color: #333;
		font-weight: 600;
	}

	.value.price {
		color: #4a90e2;
		font-size: 1.1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #555;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	.calculation {
		background: #e8f4fd;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.calculation p {
		margin: 0;
		color: #333;
	}

	.calculation strong {
		color: #4a90e2;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
	}

	.btn-primary,
	.btn-secondary {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #4a90e2;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #357abd;
	}

	.btn-primary:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #f0f0f0;
		color: #333;
	}

	.btn-secondary:hover {
		background: #e0e0e0;
	}
</style>
