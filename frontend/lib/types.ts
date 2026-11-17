// AccountSummary and Position are the Trading212 API shapes. They are
// re-exported from the backend definition rather than mirrored here, so the two
// cannot drift. The import is type-only and erases at compile time.
import type {
  AccountSummary,
  Position,
} from '@shared/trading212/trading212.types';

export type { AccountSummary, Position };

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

export interface LlmSettings {
  llmGatewayUrl: string;
  hasLlmKey: boolean;
}

export interface Insight {
  title: string;
  body: string;
  type: 'warning' | 'info' | 'suggestion';
  severity: 'low' | 'medium' | 'high';
}
