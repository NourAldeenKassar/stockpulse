import { namesMatch, normaliseCompanyName } from './company-name.js';

describe('normaliseCompanyName', () => {
  it('strips punctuation and legal forms', () => {
    expect(normaliseCompanyName('ASML Holding N.V.')).toBe('asml');
    expect(normaliseCompanyName('SAP SE')).toBe('sap');
    expect(normaliseCompanyName('Apple Inc.')).toBe('apple');
  });
});

describe('namesMatch', () => {
  // These are the real pairs returned by Finnhub's ISIN search and profile2.
  it('matches the same company written differently', () => {
    expect(namesMatch('ASML Holding NV', 'ASML Holding N.V.')).toBe(true);
    expect(namesMatch('SAP SE', 'SAP SE')).toBe(true);
    expect(namesMatch('Apple Inc.', 'Apple Inc')).toBe(true);
  });

  // A false positive here would attach another company's analyst ratings to
  // the position, which is the whole thing this guard exists to prevent.
  it('rejects different companies', () => {
    expect(namesMatch('ASML Holding NV', 'Applied Materials Inc')).toBe(false);
    expect(namesMatch('SAP SE', 'Salesforce Inc')).toBe(false);
    expect(namesMatch('Vanguard S&P 500 UCITS ETF', 'Visa Inc')).toBe(false);
  });

  it('rejects empty or missing names', () => {
    expect(namesMatch('', 'Apple Inc')).toBe(false);
    expect(namesMatch('Apple Inc', '')).toBe(false);
    // A name that is only a legal form normalises to nothing.
    expect(namesMatch('Holding NV', 'Group Ltd')).toBe(false);
  });
});
