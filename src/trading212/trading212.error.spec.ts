import { Trading212ApiError } from './trading212.error.js';

describe('Trading212ApiError', () => {
  it('flags 401 and 403 as auth failures', () => {
    expect(new Trading212ApiError(401, '/p', '').isAuthFailure).toBe(true);
    expect(new Trading212ApiError(403, '/p', '').isAuthFailure).toBe(true);
  });

  it('does not flag other statuses as auth failures', () => {
    expect(new Trading212ApiError(500, '/p', '').isAuthFailure).toBe(false);
    expect(new Trading212ApiError(429, '/p', '').isAuthFailure).toBe(false);
  });

  // The old code matched on the error message, so any body containing "401"
  // was misreported as invalid credentials.
  it('is not fooled by a 401 appearing in the response body', () => {
    const err = new Trading212ApiError(500, '/p', 'upstream returned 401 once');
    expect(err.isAuthFailure).toBe(false);
  });

  it('carries the status and path', () => {
    const err = new Trading212ApiError(404, '/api/v0/equity/positions', 'nope');
    expect(err.status).toBe(404);
    expect(err.path).toBe('/api/v0/equity/positions');
    expect(err.body).toBe('nope');
    expect(err).toBeInstanceOf(Error);
  });
});
