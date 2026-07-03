// Brokly prototype — mock data + formatting helpers.
// Money and quantities are integer MINOR units (cents), per project conventions.
window.Brokly = window.Brokly || {};

window.Brokly.mock = {
  account: {
    name: "Demo Account",
    baseCurrency: "USD",
    cashMinor: 2_500_000, // $25,000.00
  },
  // priceMinor = last price in cents; changePct = day change.
  instruments: [
    { symbol: "AAPL", name: "Apple Inc.", priceMinor: 19248, changePct: 0.84 },
    { symbol: "MSFT", name: "Microsoft Corp.", priceMinor: 42133, changePct: 1.12 },
    { symbol: "NVDA", name: "NVIDIA Corp.", priceMinor: 12345, changePct: -1.47 },
    { symbol: "TSLA", name: "Tesla Inc.", priceMinor: 25410, changePct: 2.31 },
    { symbol: "AMZN", name: "Amazon.com Inc.", priceMinor: 19872, changePct: 0.42 },
    { symbol: "GOOGL", name: "Alphabet Inc.", priceMinor: 17890, changePct: -0.28 },
    { symbol: "SPY", name: "S&P 500 ETF", priceMinor: 55620, changePct: 0.51 },
  ],
  // qty in whole shares; avgCostMinor = average cost per share in cents.
  positions: [
    { symbol: "AAPL", qty: 10, avgCostMinor: 18000 },
    { symbol: "MSFT", qty: 5, avgCostMinor: 40000 },
    { symbol: "NVDA", qty: 20, avgCostMinor: 11000 },
  ],
};

window.Brokly.fmt = {
  money(minor) {
    const sign = minor < 0 ? "-" : "";
    const n = Math.abs(minor) / 100;
    return (
      sign +
      "$" +
      n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  },
  pct(x) {
    const sign = x > 0 ? "+" : "";
    return sign + x.toFixed(2) + "%";
  },
};
