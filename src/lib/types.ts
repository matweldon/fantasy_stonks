export interface Transaction {
	id: string;
	symbol: string;
	name: string;
	type: 'BUY' | 'SELL';
	quantity: number;
	pricePerShare: number;
	totalCost: number;
	date: string; // ISO date string
	exchange: string;
}

export interface Holding {
	symbol: string;
	name: string;
	quantity: number;
	bookCost: number; // Total purchase cost
	averageCostPerShare: number;
	currentPricePerShare: number;
	currentValue: number;
	gain: number; // £
	gainPercent: number; // %
	dayGain: number; // £
	dayGainPercent: number; // %
	annualizedGainPercent: number; // %
	firstPurchaseDate: string;
	exchange: string;
}

export interface WatchlistItem {
	symbol: string;
	name: string;
	dateAdded: string;
	priceWhenAdded: number;
	currentPrice: number;
	gainSinceAdded: number;
	gainSinceAddedPercent: number;
	dayGain: number;
	dayGainPercent: number;
	annualizedGainPercent: number;
	exchange: string;
}

export interface PriceSnapshot {
	symbol: string;
	price: number;
	date: string; // ISO date string
	open?: number;
	high?: number;
	low?: number;
	close?: number;
	volume?: number;
}

export interface PortfolioSummary {
	totalValue: number;
	totalBookCost: number;
	totalGain: number;
	totalGainPercent: number;
	totalDayGain: number;
	totalDayGainPercent: number;
	annualizedGainPercent: number;
}

export interface StockQuote {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
	open: number;
	high: number;
	low: number;
	previousClose: number;
	volume: number;
	exchange: string;
	timestamp: string;
}

export interface StockSearchResult {
	symbol: string;
	name: string;
	exchange: string;
	type: string;
	currency: string;
}
