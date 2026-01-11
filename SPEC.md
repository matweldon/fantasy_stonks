# Fantasy stock portfolio

* Static web app, published using GitHub pages (prefer bun build actions)
* Typescript
* Google Sheets backend (with API key)
* 'Twelve Data' stock, ETF and mutual fund price data (with API key)
* API keys stored encrypted in localStorage. NOT sent to Google sheets.
* Modal popup for password the first time each session when the keys are loaded to memory
* Simple interface:
*   - search for stocks, ETFs, funds
    - Add funds to 'watchlist' or 'buy'
    - Buy by value
    - the app shows two tabs: watchlist and portfolio
    - At top of portfolio theres a big summary with value (£), book cost (£), gain (£,%), day gain (£,%), annualised gain (%)
    - Then list of: Stock, qty, book cost (£), value (£), gain (£,%), day gain (£,%) annualized gain (%)
    - Click through for historical data, charts etc
    - Watchlist just has: Stock, date added, Value per share, gain since added, day gain, annualised gain
* Add a list of most popular stocks, ETFs to static to speed up search
* Focus on London stock exchange to begin with
