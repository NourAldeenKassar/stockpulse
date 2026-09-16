import type { AccountSummary, Position, Snapshot } from './types';

export const demoSummary: AccountSummary = {
  id: 1,
  currency: 'EUR',
  totalValue: 48750.32,
  cash: {
    availableToTrade: 3210.45,
    reservedForOrders: 0,
    inPies: 0,
  },
  investments: {
    currentValue: 45539.87,
    totalCost: 38420.0,
    realizedProfitLoss: 2845.6,
    unrealizedProfitLoss: 7119.87,
  },
};

export const demoPositions: Position[] = [
  {
    instrument: {
      ticker: 'VUAA_EQ',
      name: 'Vanguard S&P 500 (Acc)',
      isin: 'IE00BFMXXD54',
      currency: 'EUR',
    },
    createdAt: '2024-03-15T10:00:00.000Z',
    quantity: 120.5,
    quantityAvailableForTrading: 120.5,
    quantityInPies: 0,
    currentPrice: 127.65,
    averagePricePaid: 105.2,
    walletImpact: {
      currency: 'EUR',
      totalCost: 12676.6,
      currentValue: 15381.83,
      unrealizedProfitLoss: 2705.23,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'NVDd_EQ',
      name: 'Nvidia',
      isin: 'US67066G1040',
      currency: 'USD',
    },
    createdAt: '2024-06-20T10:00:00.000Z',
    quantity: 52.0,
    quantityAvailableForTrading: 52.0,
    quantityInPies: 0,
    currentPrice: 187.04,
    averagePricePaid: 142.3,
    walletImpact: {
      currency: 'EUR',
      totalCost: 7399.6,
      currentValue: 9726.08,
      unrealizedProfitLoss: 2326.48,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'MSFT_US_EQ',
      name: 'Microsoft',
      isin: 'US5949181045',
      currency: 'USD',
    },
    createdAt: '2024-09-10T10:00:00.000Z',
    quantity: 18.0,
    quantityAvailableForTrading: 18.0,
    quantityInPies: 0,
    currentPrice: 442.5,
    averagePricePaid: 385.0,
    walletImpact: {
      currency: 'EUR',
      totalCost: 6930.0,
      currentValue: 7965.0,
      unrealizedProfitLoss: 1035.0,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'ASML_EQ',
      name: 'ASML Holding',
      isin: 'NL0010273215',
      currency: 'EUR',
    },
    createdAt: '2025-01-08T10:00:00.000Z',
    quantity: 8.0,
    quantityAvailableForTrading: 8.0,
    quantityInPies: 0,
    currentPrice: 715.8,
    averagePricePaid: 680.0,
    walletImpact: {
      currency: 'EUR',
      totalCost: 5440.0,
      currentValue: 5726.4,
      unrealizedProfitLoss: 286.4,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'AMZN_US_EQ',
      name: 'Amazon',
      isin: 'US0231351067',
      currency: 'USD',
    },
    createdAt: '2025-04-15T10:00:00.000Z',
    quantity: 22.0,
    quantityAvailableForTrading: 22.0,
    quantityInPies: 0,
    currentPrice: 198.3,
    averagePricePaid: 178.5,
    walletImpact: {
      currency: 'EUR',
      totalCost: 3927.0,
      currentValue: 4362.6,
      unrealizedProfitLoss: 435.6,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'IWDA_EQ',
      name: 'iShares Core MSCI World',
      isin: 'IE00B4L5Y983',
      currency: 'EUR',
    },
    createdAt: '2024-01-22T10:00:00.000Z',
    quantity: 35.0,
    quantityAvailableForTrading: 35.0,
    quantityInPies: 0,
    currentPrice: 92.45,
    averagePricePaid: 78.6,
    walletImpact: {
      currency: 'EUR',
      totalCost: 2751.0,
      currentValue: 3235.75,
      unrealizedProfitLoss: 484.75,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'TSLA_US_EQ',
      name: 'Tesla',
      isin: 'US88160R1014',
      currency: 'USD',
    },
    createdAt: '2025-07-01T10:00:00.000Z',
    quantity: 12.0,
    quantityAvailableForTrading: 12.0,
    quantityInPies: 0,
    currentPrice: 248.9,
    averagePricePaid: 272.0,
    walletImpact: {
      currency: 'EUR',
      totalCost: 3264.0,
      currentValue: 2986.8,
      unrealizedProfitLoss: -277.2,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'BABA_US_EQ',
      name: 'Alibaba',
      isin: 'US01609W1027',
      currency: 'USD',
    },
    createdAt: '2025-08-12T10:00:00.000Z',
    quantity: 40.0,
    quantityAvailableForTrading: 40.0,
    quantityInPies: 0,
    currentPrice: 102.3,
    averagePricePaid: 115.8,
    walletImpact: {
      currency: 'EUR',
      totalCost: 4632.0,
      currentValue: 4092.0,
      unrealizedProfitLoss: -540.0,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'SIE_EQ',
      name: 'Siemens',
      isin: 'DE0007236101',
      currency: 'EUR',
    },
    createdAt: '2025-02-18T10:00:00.000Z',
    quantity: 15.0,
    quantityAvailableForTrading: 15.0,
    quantityInPies: 0,
    currentPrice: 195.4,
    averagePricePaid: 172.0,
    walletImpact: {
      currency: 'EUR',
      totalCost: 2580.0,
      currentValue: 2931.0,
      unrealizedProfitLoss: 351.0,
      fxImpact: null,
    },
  },
  {
    instrument: {
      ticker: 'COIN_US_EQ',
      name: 'Coinbase',
      isin: 'US19260Q1076',
      currency: 'USD',
    },
    createdAt: '2026-05-20T10:00:00.000Z',
    quantity: 8.0,
    quantityAvailableForTrading: 8.0,
    quantityInPies: 0,
    currentPrice: 165.3,
    averagePricePaid: 205.0,
    walletImpact: {
      currency: 'EUR',
      totalCost: 1640.0,
      currentValue: 1322.4,
      unrealizedProfitLoss: -317.6,
      fxImpact: null,
    },
  },
];

function generateSnapshots(): Snapshot[] {
  const snapshots: Snapshot[] = [];
  const now = new Date();
  let value = 32000;

  for (let i = 180; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const trend = (180 - i) / 180;
    const noise = (Math.sin(i * 0.3) * 800) + (Math.cos(i * 0.7) * 400);
    const growth = trend * 16000;
    value = 32000 + growth + noise;

    if (i < 30) value += Math.random() * 500;

    snapshots.push({
      id: `snap-${i}`,
      takenAt: date.toISOString(),
      totalValue: Math.round(value * 100) / 100,
      cash: 3210.45,
      invested: Math.round((value - 3210.45) * 100) / 100,
      ppl: Math.round((value - 38420) * 100) / 100,
      result: 2845.6,
    });
  }

  return snapshots;
}

export const demoSnapshots: Snapshot[] = generateSnapshots();

export const demoInsights = [
  {
    title: 'Strong Growth Trajectory',
    body: 'Your portfolio is up 18.5% overall with solid unrealized gains of +7,119. The S&P 500 and Nvidia positions are your main growth drivers.',
    type: 'info' as const,
    severity: 'low' as const,
  },
  {
    title: 'High Concentration in Top 2',
    body: 'Vanguard S&P 500 and Nvidia together make up 51.5% of your portfolio. Consider rebalancing to reduce single-stock risk.',
    type: 'warning' as const,
    severity: 'medium' as const,
  },
  {
    title: 'Good Currency Diversification',
    body: 'Your portfolio spans EUR and USD assets, providing natural hedging against currency fluctuations.',
    type: 'info' as const,
    severity: 'low' as const,
  },
  {
    title: 'Consider Trimming Losers',
    body: 'Alibaba (-11.7%) and Coinbase (-19.4%) are underperforming. Review your thesis — if fundamentals changed, consider reallocating to stronger positions.',
    type: 'suggestion' as const,
    severity: 'medium' as const,
  },
  {
    title: 'Cash Position is Healthy',
    body: 'At 6.6% cash, you have a good buffer for opportunities without being over-allocated to idle funds.',
    type: 'info' as const,
    severity: 'low' as const,
  },
];
