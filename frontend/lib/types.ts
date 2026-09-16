export interface User {
  id: string;
  email: string;
}

export interface TradingAccount {
  id: string;
  label: string;
  snapshotIntervalMin: number;
  lastSnapshotAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface AccountSummary {
  id: number;
  currency: string;
  totalValue: number;
  cash: {
    availableToTrade: number;
    reservedForOrders: number;
    inPies: number;
  };
  investments: {
    currentValue: number;
    totalCost: number;
    realizedProfitLoss: number;
    unrealizedProfitLoss: number;
  };
}

export interface Position {
  instrument: {
    ticker: string;
    name: string;
    isin: string;
    currency: string;
  };
  createdAt: string;
  quantity: number;
  quantityAvailableForTrading: number;
  quantityInPies: number;
  currentPrice: number;
  averagePricePaid: number;
  walletImpact: {
    currency: string;
    totalCost: number;
    currentValue: number;
    unrealizedProfitLoss: number;
    fxImpact: number | null;
  };
}

export interface Snapshot {
  id: string;
  takenAt: string;
  totalValue: number;
  cash: number;
  invested: number;
  ppl: number;
  result: number;
  positions?: Position[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
