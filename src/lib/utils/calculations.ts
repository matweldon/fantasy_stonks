import type { Transaction, Holding, PortfolioSummary, WatchlistItem } from '$lib/types';

/**
 * Calculates the number of days between two dates
 */
export function daysBetween(dateStr1: string, dateStr2: string): number {
	const date1 = new Date(dateStr1);
	const date2 = new Date(dateStr2);
	const diffTime = Math.abs(date2.getTime() - date1.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates annualized gain percentage
 */
export function calculateAnnualizedGain(
	initialValue: number,
	currentValue: number,
	days: number
): number {
	if (days === 0 || initialValue === 0) return 0;

	const years = days / 365.25;
	const totalReturn = (currentValue - initialValue) / initialValue;
	const annualizedReturn = (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;

	return annualizedReturn;
}

/**
 * Builds holdings from transactions with current prices
 */
export function buildHoldings(
	transactions: Transaction[],
	currentPrices: Map<string, { price: number; previousClose: number }>
): Holding[] {
	const holdingsMap = new Map<string, Holding>();

	// Process transactions to build holdings
	for (const txn of transactions) {
		const existing = holdingsMap.get(txn.symbol);

		if (txn.type === 'BUY') {
			if (existing) {
				// Add to existing holding
				existing.quantity += txn.quantity;
				existing.bookCost += txn.totalCost;
				existing.averageCostPerShare = existing.bookCost / existing.quantity;

				// Update first purchase date if earlier
				if (new Date(txn.date) < new Date(existing.firstPurchaseDate)) {
					existing.firstPurchaseDate = txn.date;
				}
			} else {
				// Create new holding
				holdingsMap.set(txn.symbol, {
					symbol: txn.symbol,
					name: txn.name,
					quantity: txn.quantity,
					bookCost: txn.totalCost,
					averageCostPerShare: txn.pricePerShare,
					currentPricePerShare: 0,
					currentValue: 0,
					gain: 0,
					gainPercent: 0,
					dayGain: 0,
					dayGainPercent: 0,
					annualizedGainPercent: 0,
					firstPurchaseDate: txn.date,
					exchange: txn.exchange
				});
			}
		} else if (txn.type === 'SELL' && existing) {
			// Reduce holding
			const sellRatio = txn.quantity / existing.quantity;
			existing.quantity -= txn.quantity;
			existing.bookCost -= existing.bookCost * sellRatio;

			if (existing.quantity <= 0) {
				holdingsMap.delete(txn.symbol);
			} else {
				existing.averageCostPerShare = existing.bookCost / existing.quantity;
			}
		}
	}

	// Calculate current values and gains
	const holdings: Holding[] = [];
	for (const holding of holdingsMap.values()) {
		const priceData = currentPrices.get(holding.symbol);
		if (priceData) {
			holding.currentPricePerShare = priceData.price;
			holding.currentValue = holding.quantity * priceData.price;
			holding.gain = holding.currentValue - holding.bookCost;
			holding.gainPercent = (holding.gain / holding.bookCost) * 100;

			// Day gain
			const previousValue = holding.quantity * priceData.previousClose;
			holding.dayGain = holding.currentValue - previousValue;
			holding.dayGainPercent =
				previousValue > 0 ? (holding.dayGain / previousValue) * 100 : 0;

			// Annualized gain
			const days = daysBetween(holding.firstPurchaseDate, new Date().toISOString());
			holding.annualizedGainPercent = calculateAnnualizedGain(
				holding.bookCost,
				holding.currentValue,
				days
			);
		}

		holdings.push(holding);
	}

	return holdings.sort((a, b) => b.currentValue - a.currentValue);
}

/**
 * Calculates portfolio summary from holdings
 */
export function calculatePortfolioSummary(holdings: Holding[]): PortfolioSummary {
	const summary: PortfolioSummary = {
		totalValue: 0,
		totalBookCost: 0,
		totalGain: 0,
		totalGainPercent: 0,
		totalDayGain: 0,
		totalDayGainPercent: 0,
		annualizedGainPercent: 0
	};

	for (const holding of holdings) {
		summary.totalValue += holding.currentValue;
		summary.totalBookCost += holding.bookCost;
		summary.totalGain += holding.gain;
		summary.totalDayGain += holding.dayGain;
	}

	summary.totalGainPercent =
		summary.totalBookCost > 0 ? (summary.totalGain / summary.totalBookCost) * 100 : 0;

	summary.totalDayGainPercent =
		summary.totalValue > 0
			? (summary.totalDayGain / (summary.totalValue - summary.totalDayGain)) * 100
			: 0;

	// Calculate weighted average annualized gain
	let weightedSum = 0;
	for (const holding of holdings) {
		const weight = holding.currentValue / summary.totalValue;
		weightedSum += holding.annualizedGainPercent * weight;
	}
	summary.annualizedGainPercent = weightedSum;

	return summary;
}

/**
 * Enriches watchlist items with current prices and gains
 */
export function enrichWatchlist(
	watchlist: WatchlistItem[],
	currentPrices: Map<string, { price: number; previousClose: number }>
): WatchlistItem[] {
	return watchlist.map((item) => {
		const priceData = currentPrices.get(item.symbol);
		if (priceData) {
			item.currentPrice = priceData.price;
			item.gainSinceAdded = priceData.price - item.priceWhenAdded;
			item.gainSinceAddedPercent = (item.gainSinceAdded / item.priceWhenAdded) * 100;

			item.dayGain = priceData.price - priceData.previousClose;
			item.dayGainPercent =
				priceData.previousClose > 0 ? (item.dayGain / priceData.previousClose) * 100 : 0;

			const days = daysBetween(item.dateAdded, new Date().toISOString());
			item.annualizedGainPercent = calculateAnnualizedGain(
				item.priceWhenAdded,
				priceData.price,
				days
			);
		}
		return item;
	});
}

/**
 * Formats currency values
 */
export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value);
}

/**
 * Formats percentage values
 */
export function formatPercent(value: number): string {
	const sign = value >= 0 ? '+' : '';
	return `${sign}${value.toFixed(2)}%`;
}

/**
 * Gets color class for gain/loss
 */
export function getGainColorClass(value: number): string {
	if (value > 0) return 'positive';
	if (value < 0) return 'negative';
	return 'neutral';
}
