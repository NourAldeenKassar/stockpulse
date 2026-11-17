import { parseTrading212Ticker } from './symbol.js';

describe('parseTrading212Ticker', () => {
  it('maps a US listing directly and marks it confident', () => {
    expect(parseTrading212Ticker('AAPL_US_EQ')).toEqual({
      symbol: 'AAPL',
      confident: true,
    });
    expect(parseTrading212Ticker('BRK.B_US_EQ')).toEqual({
      symbol: 'BRK.B',
      confident: true,
    });
  });

  // These are the ones that silently produce wrong data if trusted: the base
  // symbol alone does not identify the listing on a non-US venue.
  it('does not trust venue-suffixed European listings', () => {
    expect(parseTrading212Ticker('VUSAl_EQ')).toEqual({
      symbol: 'VUSA',
      confident: false,
    });
    expect(parseTrading212Ticker('SAPd_EQ')).toEqual({
      symbol: 'SAP',
      confident: false,
    });
    expect(parseTrading212Ticker('ASMLa_EQ')).toEqual({
      symbol: 'ASML',
      confident: false,
    });
  });

  it('does not trust a plain _EQ ticker', () => {
    expect(parseTrading212Ticker('CSPX_EQ')).toEqual({
      symbol: 'CSPX',
      confident: false,
    });
  });

  it('returns null when there is nothing usable', () => {
    expect(parseTrading212Ticker('')).toBeNull();
    expect(parseTrading212Ticker('____')).toBeNull();
  });
});
