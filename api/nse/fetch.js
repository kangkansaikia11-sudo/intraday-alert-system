export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    // Yahoo Finance uses NSE symbols with .NS
    const yahooSymbol = `${symbol}.NS`;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=5m&range=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Yahoo fetch failed");
    }

    const json = await response.json();

    const result = json?.chart?.result?.[0];
    if (!result) {
      throw new Error("No chart result");
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    const candles = timestamps.map((t, i) => ({
      time: new Date(t * 1000).toISOString(),
      open: quotes.open?.[i],
      high: quotes.high?.[i],
      low: quotes.low?.[i],
      close: quotes.close?.[i]
    })).filter(c => c.open !== null);

    return res.status(200).json({
      symbol,
      source: "Yahoo Finance",
      interval: "5m",
      candles
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch intraday data",
      details: error.message
    });
  }
}
