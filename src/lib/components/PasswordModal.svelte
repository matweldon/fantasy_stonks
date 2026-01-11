<script lang="ts">
	import { hasStoredApiKeys, unlockApiKeys, saveApiKeys } from '$lib/stores/apiKeys';

	let isOpen = $state(true);
	let password = $state('');
	let error = $state('');
	let isSetup = $state(!hasStoredApiKeys());

	// Setup form fields
	let googleSheetsApiKey = $state('');
	let twelveDataApiKey = $state('');
	let googleSheetId = $state('');

	async function handleUnlock() {
		error = '';
		try {
			await unlockApiKeys(password);
			isOpen = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to unlock';
		}
	}

	async function handleSetup() {
		error = '';
		if (!googleSheetsApiKey || !twelveDataApiKey || !googleSheetId || !password) {
			error = 'All fields are required';
			return;
		}

		try {
			await saveApiKeys(
				{
					googleSheetsApiKey,
					twelveDataApiKey,
					googleSheetId
				},
				password
			);
			await unlockApiKeys(password);
			isOpen = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save API keys';
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (isSetup) {
			handleSetup();
		} else {
			handleUnlock();
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay">
		<div class="modal">
			<h2>{isSetup ? 'Setup API Keys' : 'Unlock API Keys'}</h2>

			<form onsubmit={handleSubmit}>
				{#if isSetup}
					<div class="form-group">
						<label for="googleSheetsApiKey">Google Sheets API Key</label>
						<input
							type="text"
							id="googleSheetsApiKey"
							bind:value={googleSheetsApiKey}
							placeholder="Enter your Google Sheets API key"
							required
						/>
					</div>

					<div class="form-group">
						<label for="twelveDataApiKey">Twelve Data API Key</label>
						<input
							type="text"
							id="twelveDataApiKey"
							bind:value={twelveDataApiKey}
							placeholder="Enter your Twelve Data API key"
							required
						/>
					</div>

					<div class="form-group">
						<label for="googleSheetId">Google Sheet ID</label>
						<input
							type="text"
							id="googleSheetId"
							bind:value={googleSheetId}
							placeholder="Enter your Google Sheet ID"
							required
						/>
						<small
							>Find this in your Google Sheets URL:
							https://docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit</small
						>
					</div>

					<div class="form-group">
						<label for="password">Encryption Password</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							placeholder="Create a password to encrypt your keys"
							required
						/>
						<small>Remember this password - you'll need it each session!</small>
					</div>
				{:else}
					<p>Enter your password to unlock your API keys for this session.</p>
					<div class="form-group">
						<label for="password">Password</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							placeholder="Enter your password"
							required
							autofocus
						/>
					</div>
				{/if}

				{#if error}
					<div class="error">{error}</div>
				{/if}

				<button type="submit" class="btn-primary">
					{isSetup ? 'Save & Unlock' : 'Unlock'}
				</button>
			</form>

			{#if !isSetup}
				<button class="btn-link" onclick={() => (isSetup = true)}> Reset and setup new keys </button
				>
			{/if}
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
		border-radius: 8px;
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
	}

	h2 {
		margin-top: 0;
		color: #333;
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
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	small {
		display: block;
		margin-top: 0.25rem;
		color: #777;
		font-size: 0.875rem;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.btn-primary {
		width: 100%;
		padding: 0.75rem;
		background: #4a90e2;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #357abd;
	}

	.btn-link {
		background: none;
		border: none;
		color: #4a90e2;
		cursor: pointer;
		margin-top: 1rem;
		padding: 0;
		font-size: 0.875rem;
	}

	.btn-link:hover {
		text-decoration: underline;
	}
</style>
