import type { StockQuote, StockSearchResult, PriceSnapshot } from '$lib/types';

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

/**
 * Twelve Data API client for stock prices and data
 */
export class TwelveDataService {
	constructor(private apiKey: string) {}

	/**
	 * Search for stocks, ETFs, and funds
	 */
	async search(query: string, exchange?: string): Promise<StockSearchResult[]> {
		const params = new URLSearchParams({
			symbol: query,
			apikey: this.apiKey
		});

		if (exchange) {
			params.append('exchange', exchange);
		}

		const url = `${TWELVE_DATA_BASE}/symbol_search?${params}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to search stocks: ${response.statusText}`);
		}

		const data = await response.json();
		return (data.data || []).map((item: any) => ({
			symbol: item.symbol,
			name: item.instrument_name,
			exchange: item.exchange,
			type: item.instrument_type,
			currency: item.currency
		}));
	}

	/**
	 * Get real-time quote for a symbol
	 */
	async getQuote(symbol: string, exchange?: string): Promise<StockQuote> {
		const params = new URLSearchParams({
			symbol,
			apikey: this.apiKey
		});

		if (exchange) {
			params.append('exchange', exchange);
		}

		const url = `${TWELVE_DATA_BASE}/quote?${params}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to get quote: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.status === 'error') {
			throw new Error(data.message || 'Failed to get quote');
		}

		return {
			symbol: data.symbol,
			name: data.name,
			price: parseFloat(data.close || data.price),
			change: parseFloat(data.change || 0),
			changePercent: parseFloat(data.percent_change || 0),
			open: parseFloat(data.open || 0),
			high: parseFloat(data.high || 0),
			low: parseFloat(data.low || 0),
			previousClose: parseFloat(data.previous_close || 0),
			volume: parseFloat(data.volume || 0),
			exchange: data.exchange || exchange || '',
			timestamp: data.datetime || new Date().toISOString()
		};
	}

	/**
	 * Get multiple quotes at once
	 */
	async getQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
		const symbolsParam = symbols.join(',');
		const params = new URLSearchParams({
			symbol: symbolsParam,
			apikey: this.apiKey
		});

		const url = `${TWELVE_DATA_BASE}/quote?${params}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to get quotes: ${response.statusText}`);
		}

		const data = await response.json();
		const quotes = new Map<string, StockQuote>();

		// Handle both single and multiple symbol responses
		const items = Array.isArray(data) ? data : [data];

		for (const item of items) {
			if (item.status !== 'error') {
				quotes.set(item.symbol, {
					symbol: item.symbol,
					name: item.name,
					price: parseFloat(item.close || item.price),
					change: parseFloat(item.change || 0),
					changePercent: parseFloat(item.percent_change || 0),
					open: parseFloat(item.open || 0),
					high: parseFloat(item.high || 0),
					low: parseFloat(item.low || 0),
					previousClose: parseFloat(item.previous_close || 0),
					volume: parseFloat(item.volume || 0),
					exchange: item.exchange || '',
					timestamp: item.datetime || new Date().toISOString()
				});
			}
		}

		return quotes;
	}

	/**
	 * Get historical time series data
	 */
	async getTimeSeries(
		symbol: string,
		interval: string = '1day',
		outputSize: number = 30,
		exchange?: string
	): Promise<PriceSnapshot[]> {
		const params = new URLSearchParams({
			symbol,
			interval,
			outputsize: outputSize.toString(),
			apikey: this.apiKey
		});

		if (exchange) {
			params.append('exchange', exchange);
		}

		const url = `${TWELVE_DATA_BASE}/time_series?${params}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to get time series: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.status === 'error') {
			throw new Error(data.message || 'Failed to get time series');
		}

		return (data.values || []).map((item: any) => ({
			symbol,
			date: item.datetime,
			price: parseFloat(item.close),
			open: parseFloat(item.open),
			high: parseFloat(item.high),
			low: parseFloat(item.low),
			close: parseFloat(item.close),
			volume: parseFloat(item.volume || 0)
		}));
	}

	/**
	 * Get end of day price
	 */
	async getEndOfDay(symbol: string, exchange?: string): Promise<PriceSnapshot> {
		const params = new URLSearchParams({
			symbol,
			apikey: this.apiKey
		});

		if (exchange) {
			params.append('exchange', exchange);
		}

		const url = `${TWELVE_DATA_BASE}/eod?${params}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to get EOD price: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.status === 'error') {
			throw new Error(data.message || 'Failed to get EOD price');
		}

		return {
			symbol,
			date: data.datetime,
			price: parseFloat(data.close),
			open: parseFloat(data.open || 0),
			high: parseFloat(data.high || 0),
			low: parseFloat(data.low || 0),
			close: parseFloat(data.close),
			volume: parseFloat(data.volume || 0)
		};
	}
}
