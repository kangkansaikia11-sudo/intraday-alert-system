export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    const url = `https://www.nseindia.com/api/chart-databyindex?index=${symbol}EQN`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.nseindia.com/"
      }
    });

    if (!response.ok) {
      throw new Error("NSE fetch failed");
    }

    const data = await response.json();

    return res.status(200).json({
      symbol,
      source: "NSE",
      raw: data
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch NSE data",
      details: error.message
    });
  }
}
