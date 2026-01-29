export default async function handler(req, res) {
  const alerts = global.alerts || [];

  if (!alerts.length) {
    return res.status(200).json({
      status: "no-alerts",
      message: "No alerts to evaluate"
    });
  }

  const evaluations = [];

  for (const alert of alerts) {
    const { symbol, alertTime } = alert;

    try {
      // Fetch intraday candles from existing Yahoo endpoint
      const response = await fetch(
        `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/nse/fetch?symbol=${symbol}`
      );

      const data = await response.json();
      const candles = data.candles || [];

      // Filter candles AFTER alert candle close
      const postAlertCandles = candles.filter(
        c => new Date(c.time) > new Date(alertTime)
      );

      evaluations.push({
        symbol,
        alertTime,
        candleCount: postAlertCandles.length
      });

    } catch (error) {
      evaluations.push({
        symbol,
        alertTime,
        error: error.message
      });
    }
  }

  return res.status(200).json({
    status: "evaluated",
    evaluations
  });
}
