# 💰 Fantasy Stonks

A fantasy stock portfolio tracker built with Svelte 5, TypeScript, and Bun. Track your imaginary investments in London Stock Exchange stocks with real-time prices!

## Features

- 🔐 **Secure API Key Storage** - AES-GCM encryption for API keys in localStorage
- 📊 **Portfolio Tracking** - Track holdings with real-time values and gains
- 👀 **Watchlist** - Monitor stocks you're interested in
- 💷 **Buy by Value** - Purchase stocks by specifying the amount to invest
- 📈 **Charts & Analytics** - Historical price charts with Chart.js
- 🎯 **Popular LSE Stocks** - Quick access to top London Stock Exchange stocks
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Frontend**: Svelte 5 with TypeScript
- **Build Tool**: Bun + Vite
- **Backend**: Google Sheets API for data storage
- **Stock Data**: Twelve Data API
- **Deployment**: GitHub Pages
- **Charts**: Chart.js

## Prerequisites

You'll need:

1. **Google Sheets API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable the Google Sheets API
   - Create credentials (API Key)
   - Copy the API key

2. **Google Sheet**
   - Create a new Google Sheet
   - Share it with "Anyone with the link can edit"
   - Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

3. **Twelve Data API Key**
   - Sign up at [Twelve Data](https://twelvedata.com/)
   - Get a free API key from your dashboard

## Getting Started

### Development

1. Clone the repository
```bash
git clone https://github.com/matweldon/fantasy_stonks.git
cd fantasy_stonks
```

2. Install dependencies
```bash
bun install
```

3. Start the development server
```bash
bun run dev
```

4. Open [http://localhost:5173](http://localhost:5173)

### First-Time Setup

When you first open the app, you'll see a setup modal:

1. Enter your **Google Sheets API Key**
2. Enter your **Twelve Data API Key**
3. Enter your **Google Sheet ID**
4. Create an **encryption password** (remember this!)

Your API keys will be encrypted and stored in your browser's localStorage. You'll need to enter your password at the start of each session.

## How to Use

### Portfolio Tab

- **Summary**: View total value, book cost, gains (total, day, annualized)
- **Holdings**: See all your positions with detailed metrics
- Click on any holding to view detailed charts

### Watchlist Tab

- Track stocks without buying them
- See gains since you added them
- Remove stocks from watchlist

### Buying Stocks

1. Search for a stock using the search bar
2. Click on a stock from results or popular stocks
3. Choose "OK" in the dialog to buy (or "Cancel" to add to watchlist)
4. Enter the amount you want to invest (in GBP)
5. The app calculates how many shares you can buy
6. Confirm the purchase

### Stock Details

Click on any stock (from portfolio or watchlist) to view:
- Current price and day's change
- Open, High, Low, Previous Close
- Volume and Exchange
- Historical price chart

## Data Structure

The app creates three sheets in your Google Sheet:

### Transactions
Stores all buy/sell transactions with columns:
- ID, Symbol, Name, Type, Quantity, Price Per Share, Total Cost, Date, Exchange

### Watchlist
Tracks watched stocks:
- Symbol, Name, Date Added, Price When Added, Exchange

### PriceHistory
Historical price snapshots:
- Symbol, Date, Price, Open, High, Low, Close, Volume

## Calculations

- **Total Gain**: Current value minus book cost
- **Day Gain**: Change from previous close
- **Annualized Gain**: Compound annual growth rate from purchase date

## Building for Production

```bash
bun run build
```

The static site will be generated in the `build` directory.

## Deployment

The app is configured for GitHub Pages deployment with both automatic and manual options:

### Automatic Deployment
1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Access your app at `https://yourusername.github.io/fantasy_stonks/`

### Manual Deployment
1. Go to the **Actions** tab in your GitHub repository
2. Select **Deploy to GitHub Pages** from the workflows list
3. Click **Run workflow** button
4. Choose the deployment environment (production/preview)
5. Click **Run workflow** to start the deployment

This is useful when you want to deploy without pushing to main, or redeploy the current code.

Note: Update the `base` path in `svelte.config.js` if your repository name differs.

## Security Notes

⚠️ **Important**: This is a hobby project with basic security measures:

- API keys are encrypted with AES-GCM before storing in localStorage
- Keys are never sent to Google Sheets, only used client-side
- Use a strong encryption password
- Don't use this for real financial data or actual trading

## API Rate Limits

Be aware of API rate limits:
- **Twelve Data Free Tier**: 800 API calls/day
- **Google Sheets API**: 500 requests per 100 seconds per project

The app minimizes API calls by batching requests and caching data in your Google Sheet.

## Development

### Project Structure

```
src/
├── lib/
│   ├── components/      # Svelte components
│   ├── services/        # API services
│   ├── stores/          # Svelte stores
│   ├── utils/           # Utility functions
│   ├── data/            # Static data
│   ├── crypto.ts        # Encryption utilities
│   └── types.ts         # TypeScript types
└── routes/
    └── +page.svelte     # Main app page
```

### Key Technologies

- **Svelte 5 Runes**: Using `$state`, `$props`, `$effect`
- **Static Site Generation**: Via `@sveltejs/adapter-static`
- **Web Crypto API**: For AES-GCM encryption
- **Chart.js**: For price history charts

## Contributing

This is a personal hobby project, but suggestions and improvements are welcome!

## License

MIT

## Disclaimer

**For entertainment purposes only.** This is not financial advice. The data is for educational purposes and should not be used for actual investment decisions.
