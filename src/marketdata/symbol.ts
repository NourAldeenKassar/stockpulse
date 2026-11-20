export interface SymbolCandidate {
  /** Best guess at the market-data symbol. */
  symbol: string;
  /**
   * True only for US listings, where the Trading212 ticker maps directly.
   * Anything else needs an ISIN lookup before it can be trusted.
   */
  confident: boolean;
}

/**
 * Trading212 tickers look like:
 *   AAPL_US_EQ   US listing, maps straight to AAPL
 *   VUSAl_EQ     London, trailing lowercase letter is the venue
 *   SAPd_EQ      Xetra
 *   ASMLa_EQ     Amsterdam
 *
 * Only the US form is safe to use directly. For the rest the base symbol is
 * returned as an unconfident guess, and the caller is expected to confirm it
 * against the instrument's ISIN before showing anything.
 */
export function parseTrading212Ticker(ticker: string): SymbolCandidate | null {
  if (!ticker) return null;

  const us = /^([A-Z0-9.]+)_US_EQ$/.exec(ticker);
  if (us) return { symbol: us[1], confident: true };

  // Venue-suffixed form: a trailing lowercase letter before _EQ.
  const venue = /^([A-Z0-9.]+)[a-z]_EQ$/.exec(ticker);
  if (venue) return { symbol: venue[1], confident: false };

  const plain = /^([A-Z0-9.]+)_EQ$/.exec(ticker);
  if (plain) return { symbol: plain[1], confident: false };

  // Unrecognised shape: take anything before the first underscore, if useful.
  const base = ticker.split('_')[0];
  if (/^[A-Z0-9.]{1,8}$/.test(base)) {
    return { symbol: base, confident: false };
  }

  return null;
}
