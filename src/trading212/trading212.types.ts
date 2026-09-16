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

export interface Transaction {
  amount: number;
  currency: string;
  dateTime: string;
  reference: string;
  type:
    | 'WITHDRAW'
    | 'DEPOSIT'
    | 'FEE'
    | 'TRANSFER'
    | 'INTEREST_ON_FREE_CASH'
    | 'LENDING_INTEREST';
}

export interface Dividend {
  amount: number;
  paidOn: string;
  quantity: number;
  reference: string;
  ticker: string;
  type: string;
}

export interface HistoricalOrder {
  dateCreated: string;
  dateExecuted: string;
  dateModified: string;
  executor: string;
  fillCost: number;
  fillPrice: number;
  fillResult: number;
  filledQuantity: number;
  filledValue: number;
  id: number;
  limitPrice: number;
  orderedQuantity: number;
  orderedValue: number;
  parentOrder: number;
  status: string;
  stopPrice: number;
  taxes: {
    fillId: string;
    name: string;
    quantity: number;
    timeCharged: string;
  }[];
  ticker: string;
  type: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextPagePath: string | null;
}
