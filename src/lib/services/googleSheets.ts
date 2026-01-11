import type { Transaction, WatchlistItem, PriceSnapshot } from '$lib/types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

interface SheetRange {
	range: string;
	values: any[][];
}

/**
 * Google Sheets API client
 */
export class GoogleSheetsService {
	constructor(
		private apiKey: string,
		private spreadsheetId: string
	) {}

	/**
	 * Reads values from a sheet range
	 */
	private async readRange(range: string): Promise<any[][]> {
		const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to read from Google Sheets: ${response.statusText}`);
		}

		const data = await response.json();
		return data.values || [];
	}

	/**
	 * Appends values to a sheet
	 */
	private async appendToSheet(range: string, values: any[][]): Promise<void> {
		const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${this.apiKey}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ values })
		});

		if (!response.ok) {
			throw new Error(`Failed to append to Google Sheets: ${response.statusText}`);
		}
	}

	/**
	 * Updates values in a sheet range
	 */
	private async updateRange(range: string, values: any[][]): Promise<void> {
		const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${this.apiKey}`;

		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ values })
		});

		if (!response.ok) {
			throw new Error(`Failed to update Google Sheets: ${response.statusText}`);
		}
	}

	/**
	 * Batch updates multiple ranges
	 */
	private async batchUpdate(data: SheetRange[]): Promise<void> {
		const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values:batchUpdate?key=${this.apiKey}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				valueInputOption: 'USER_ENTERED',
				data: data.map((d) => ({ range: d.range, values: d.values }))
			})
		});

		if (!response.ok) {
			throw new Error(`Failed to batch update Google Sheets: ${response.statusText}`);
		}
	}

	// === Transactions ===

	async getTransactions(): Promise<Transaction[]> {
		const values = await this.readRange('Transactions!A2:I');
		return values.map((row) => ({
			id: row[0],
			symbol: row[1],
			name: row[2],
			type: row[3] as 'BUY' | 'SELL',
			quantity: parseFloat(row[4]),
			pricePerShare: parseFloat(row[5]),
			totalCost: parseFloat(row[6]),
			date: row[7],
			exchange: row[8]
		}));
	}

	async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
		const id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const values = [
			[
				id,
				transaction.symbol,
				transaction.name,
				transaction.type,
				transaction.quantity,
				transaction.pricePerShare,
				transaction.totalCost,
				transaction.date,
				transaction.exchange
			]
		];
		await this.appendToSheet('Transactions!A:I', values);
	}

	// === Watchlist ===

	async getWatchlist(): Promise<WatchlistItem[]> {
		const values = await this.readRange('Watchlist!A2:D');
		return values.map((row) => ({
			symbol: row[0],
			name: row[1],
			dateAdded: row[2],
			priceWhenAdded: parseFloat(row[3]),
			exchange: row[4],
			// These will be calculated on the client side with current prices
			currentPrice: 0,
			gainSinceAdded: 0,
			gainSinceAddedPercent: 0,
			dayGain: 0,
			dayGainPercent: 0,
			annualizedGainPercent: 0
		}));
	}

	async addToWatchlist(symbol: string, name: string, price: number, exchange: string): Promise<void> {
		const values = [[symbol, name, new Date().toISOString(), price, exchange]];
		await this.appendToSheet('Watchlist!A:E', values);
	}

	async removeFromWatchlist(symbol: string): Promise<void> {
		// Note: Google Sheets API doesn't support row deletion directly
		// This would require using the spreadsheets.batchUpdate method with DeleteDimensionRequest
		// For now, we'll just clear the row content
		const watchlist = await this.getWatchlist();
		const index = watchlist.findIndex((item) => item.symbol === symbol);
		if (index !== -1) {
			const range = `Watchlist!A${index + 2}:E${index + 2}`;
			await this.updateRange(range, [['', '', '', '', '']]);
		}
	}

	// === Price History ===

	async savePriceSnapshot(snapshot: PriceSnapshot): Promise<void> {
		const values = [
			[
				snapshot.symbol,
				snapshot.date,
				snapshot.price,
				snapshot.open || '',
				snapshot.high || '',
				snapshot.low || '',
				snapshot.close || '',
				snapshot.volume || ''
			]
		];
		await this.appendToSheet('PriceHistory!A:H', values);
	}

	async getPriceHistory(symbol: string, limit: number = 100): Promise<PriceSnapshot[]> {
		const values = await this.readRange('PriceHistory!A2:H');
		return values
			.filter((row) => row[0] === symbol)
			.slice(-limit)
			.map((row) => ({
				symbol: row[0],
				date: row[1],
				price: parseFloat(row[2]),
				open: row[3] ? parseFloat(row[3]) : undefined,
				high: row[4] ? parseFloat(row[4]) : undefined,
				low: row[5] ? parseFloat(row[5]) : undefined,
				close: row[6] ? parseFloat(row[6]) : undefined,
				volume: row[7] ? parseFloat(row[7]) : undefined
			}));
	}

	// === Initialization ===

	/**
	 * Initializes the sheet with headers if they don't exist
	 */
	async initializeSheets(): Promise<void> {
		try {
			// Check if sheets exist by trying to read them
			await this.readRange('Transactions!A1:I1');
		} catch {
			// Initialize Transactions sheet
			await this.updateRange('Transactions!A1:I1', [
				['ID', 'Symbol', 'Name', 'Type', 'Quantity', 'Price Per Share', 'Total Cost', 'Date', 'Exchange']
			]);
		}

		try {
			await this.readRange('Watchlist!A1:E1');
		} catch {
			// Initialize Watchlist sheet
			await this.updateRange('Watchlist!A1:E1', [
				['Symbol', 'Name', 'Date Added', 'Price When Added', 'Exchange']
			]);
		}

		try {
			await this.readRange('PriceHistory!A1:H1');
		} catch {
			// Initialize PriceHistory sheet
			await this.updateRange('PriceHistory!A1:H1', [
				['Symbol', 'Date', 'Price', 'Open', 'High', 'Low', 'Close', 'Volume']
			]);
		}
	}
}
