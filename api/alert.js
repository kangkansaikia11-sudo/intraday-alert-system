// Serverless-safe alert + evaluation handler

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const {
    symbol,
    direction,
    alertTime,
    entry,
    stoploss,
    target
  } = req.body || {};

  if (
    !symbol ||
    !direction ||
    !alertTime ||
    entry === undefined ||
    stoploss === undefined ||
    target === undefined
  ) {
    return res.status(400).json({ error: "Missing required alert fields" });
  }

  try {
    // 1️⃣ Fetch intraday candles from Yahoo (evaluation only)
    const yahooUrl =
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=5m&range=1d`;

    const response = await fetch(yahooUrl, {
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
      throw new Error("No Yahoo chart data");
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};

    const candles = timestamps.map((t, i) => ({
      time: new Date(t * 1000),
      open: quote.open?.[i],
      high: quote.high?.[i],
      low: quote.low?.[i],
      close: quote.close?.[i]
    })).filter(c => c.open !== null);

    // 2️⃣ Consider ONLY candles AFTER alert candle close
//     AND before 3:15 PM IST cutoff
const alertDate = new Date(alertTime);

// Build 3:15 PM IST cutoff for the same trading day
const cutoff = new Date(alertDate);
cutoff.setHours(15, 15, 0, 0); // 3:15 PM IST

const postAlertCandles = candles.filter(c =>
  c.time > alertDate && c.time <= cutoff
);

    // 3️⃣ Evaluate SL / Target hit (LOCKED LOGIC)
    let outcome = "NO_HIT";

    for (const c of postAlertCandles) {
      if (direction === "BUY") {
        if (c.low <= stoploss) {
          outcome = "SL_HIT";
          break;
        }
        if (c.high >= target) {
          outcome = "TARGET_HIT";
          break;
        }
      }

      if (direction === "SELL") {
        if (c.high >= stoploss) {
          outcome = "SL_HIT";
          break;
        }
        if (c.low <= target) {
          outcome = "TARGET_HIT";
          break;
        }
      }
    }

    // 4️⃣ Return evaluated alert
    return res.status(200).json({
      status: "evaluated",
      symbol,
      direction,
      alertTime,
      entry,
      stoploss,
      target,
      outcome
    });

  } catch (error) {
    return res.status(500).json({
      error: "Evaluation failed",
      details: error.message
    });
  }
}

