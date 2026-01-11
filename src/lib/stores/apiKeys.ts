import { writable } from 'svelte/store';
import { secureStore, secureRetrieve, hasSecureData } from '$lib/crypto';

const GOOGLE_SHEETS_KEY = 'google_sheets_api_key';
const TWELVE_DATA_KEY = 'twelve_data_api_key';
const GOOGLE_SHEET_ID_KEY = 'google_sheet_id';

export interface ApiKeys {
	googleSheetsApiKey: string;
	twelveDataApiKey: string;
	googleSheetId: string;
}

// In-memory store for the current session
export const apiKeys = writable<ApiKeys | null>(null);
export const isUnlocked = writable<boolean>(false);

/**
 * Stores API keys encrypted in localStorage
 */
export async function saveApiKeys(keys: ApiKeys, password: string): Promise<void> {
	await Promise.all([
		secureStore(GOOGLE_SHEETS_KEY, keys.googleSheetsApiKey, password),
		secureStore(TWELVE_DATA_KEY, keys.twelveDataApiKey, password),
		secureStore(GOOGLE_SHEET_ID_KEY, keys.googleSheetId, password)
	]);
}

/**
 * Loads API keys from localStorage into memory
 */
export async function unlockApiKeys(password: string): Promise<void> {
	try {
		const [googleSheetsApiKey, twelveDataApiKey, googleSheetId] = await Promise.all([
			secureRetrieve(GOOGLE_SHEETS_KEY, password),
			secureRetrieve(TWELVE_DATA_KEY, password),
			secureRetrieve(GOOGLE_SHEET_ID_KEY, password)
		]);

		if (!googleSheetsApiKey || !twelveDataApiKey || !googleSheetId) {
			throw new Error('No API keys found in storage');
		}

		apiKeys.set({
			googleSheetsApiKey,
			twelveDataApiKey,
			googleSheetId
		});
		isUnlocked.set(true);
	} catch (error) {
		throw new Error('Failed to unlock API keys. Please check your password.');
	}
}

/**
 * Checks if API keys are stored
 */
export function hasStoredApiKeys(): boolean {
	return (
		hasSecureData(GOOGLE_SHEETS_KEY) &&
		hasSecureData(TWELVE_DATA_KEY) &&
		hasSecureData(GOOGLE_SHEET_ID_KEY)
	);
}

/**
 * Clears API keys from memory (logout)
 */
export function lockApiKeys(): void {
	apiKeys.set(null);
	isUnlocked.set(false);
}
