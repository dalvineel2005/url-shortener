const yahooFinance = require('yahoo-finance2').default;

async function getStockDashboard(req, res) {
    return res.render('stocks', {
        price: null,
        symbol: null,
        error: null
    });
}

async function getStockPrice(req, res) {
    const symbol = req.body.symbol;
    if (!symbol) {
        return res.render('stocks', {
            price: null,
            symbol: null,
            error: 'Please provide a stock symbol.'
        });
    }

    try {
        const quote = await yahooFinance.quote(symbol);
        
        // Use regularMarketPrice for current price
        return res.render('stocks', {
            price: `${quote.currency} ${quote.regularMarketPrice}`,
            symbol: symbol,
            error: null
        });
    } catch (error) {
        console.error("Error fetching stock price:", error);
        return res.render('stocks', {
            price: null,
            symbol: symbol,
            error: 'Could not fetch price. Please check the symbol and try again.'
        });
    }
}

async function placeTrade(req, res) {
    const { symbol, action, quantity } = req.body;
    
    // In a real scenario, this would use BROKER_API_KEY from process.env
    // to authenticate with Zerodha/Upstox/Alpaca and place the order
    console.log(`[MOCK BROKER API] Placed ${action} order for ${quantity} shares of ${symbol}`);

    return res.render('stocks', {
        price: null,
        symbol: symbol,
        error: `Successfully placed mock ${action} order for ${quantity} shares of ${symbol}.`
    });
}

module.exports = {
    getStockDashboard,
    getStockPrice,
    placeTrade
};
