const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const passwordKey = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		passwordKey,
		{ name: 'AES-GCM', length: KEY_LENGTH },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Encrypts data using AES-GCM
 */
export async function encrypt(data: string, password: string): Promise<string> {
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const key = await deriveKey(password, salt);

	const encryptedData = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		encoder.encode(data)
	);

	// Combine salt + iv + encrypted data
	const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
	combined.set(salt, 0);
	combined.set(iv, salt.length);
	combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

	// Convert to base64 for storage
	return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data using AES-GCM
 */
export async function decrypt(encryptedData: string, password: string): Promise<string> {
	try {
		// Decode from base64
		const combined = new Uint8Array(
			atob(encryptedData)
				.split('')
				.map((char) => char.charCodeAt(0))
		);

		// Extract salt, iv, and encrypted data
		const salt = combined.slice(0, SALT_LENGTH);
		const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
		const data = combined.slice(SALT_LENGTH + IV_LENGTH);

		const key = await deriveKey(password, salt);

		const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

		const decoder = new TextDecoder();
		return decoder.decode(decryptedData);
	} catch (error) {
		throw new Error('Decryption failed. Incorrect password or corrupted data.');
	}
}

/**
 * Securely stores encrypted data in localStorage
 */
export async function secureStore(key: string, value: string, password: string): Promise<void> {
	const encrypted = await encrypt(value, password);
	localStorage.setItem(key, encrypted);
}

/**
 * Retrieves and decrypts data from localStorage
 */
export async function secureRetrieve(key: string, password: string): Promise<string | null> {
	const encrypted = localStorage.getItem(key);
	if (!encrypted) return null;

	return decrypt(encrypted, password);
}

/**
 * Checks if encrypted data exists in localStorage
 */
export function hasSecureData(key: string): boolean {
	return localStorage.getItem(key) !== null;
}

/**
 * Removes encrypted data from localStorage
 */
export function removeSecureData(key: string): void {
	localStorage.removeItem(key);
}
