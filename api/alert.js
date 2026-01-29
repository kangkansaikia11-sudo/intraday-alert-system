// In-memory alert store (resets on redeploy / restart)
global.alerts = global.alerts || [];

export default function handler(req, res) {
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

  // Validation
  if (
    !symbol ||
    !direction ||
    !alertTime ||
    entry === undefined ||
    stoploss === undefined ||
    target === undefined
  ) {
    return res.status(400).json({
      error: "Missing required alert fields"
    });
  }

  const alert = {
    symbol,
    direction,
    alertTime, // candle close time
    entry,
    stoploss,
    target
  };

  global.alerts.push(alert);

  return res.status(200).json({
    status: "stored",
    alertCount: global.alerts.length
  });
}
