export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    // 1️⃣ Bootstrap NSE session (get cookies)
    const homeResponse = await fetch("https://www.nseindia.com", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html",
      }
    });

    const setCookie = homeResponse.headers.get("set-cookie");

    if (!setCookie) {
      throw new Error("Failed to obtain NSE cookies");
    }

    // 2️⃣ Fetch equity quote using same session
    const apiUrl = `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`;

    const dataResponse = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.nseindia.com/",
        "Cookie": setCookie
      }
    });

    if (!dataResponse.ok) {
      throw new Error("NSE data fetch failed");
    }

    const data = await dataResponse.json();

    // 3️⃣ Extract intraday data (5-minute buckets)
    const candles =
      data?.priceInfo?.intradayHighLow ||
      data?.intraDayHighLow ||
      data?.grapthData ||
      [];

    return res.status(200).json({
      symbol,
      source: "NSE",
      candles
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch NSE intraday data",
      details: error.message
    });
  }
}
