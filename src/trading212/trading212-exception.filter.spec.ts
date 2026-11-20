import type { ArgumentsHost } from '@nestjs/common';
import { Trading212ApiError } from './trading212.error.js';
import { Trading212ExceptionFilter } from './trading212-exception.filter.js';

interface Captured {
  status: number;
  body: { statusCode: number; error: string; message: string };
}

function run(error: Trading212ApiError): Captured {
  const captured = {} as Captured;
  const response = {
    status(code: number) {
      captured.status = code;
      return {
        json(body: Captured['body']) {
          captured.body = body;
        },
      };
    },
  };

  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  new Trading212ExceptionFilter().catch(error, host);
  return captured;
}

describe('Trading212ExceptionFilter', () => {
  // Without the filter these reached Nest's default handler and became a bare
  // "Internal server error", which blames us for an upstream problem.
  it('maps rate limiting to 429 with an explanation', () => {
    const { status, body } = run(new Trading212ApiError(429, '/summary', ''));
    expect(status).toBe(429);
    expect(body.message).toMatch(/rate limiting/i);
  });

  it('maps rejected credentials to 400 pointing at Settings', () => {
    const { status, body } = run(new Trading212ApiError(401, '/summary', ''));
    expect(status).toBe(400);
    expect(body.message).toMatch(/Settings/);
  });

  it('maps upstream server errors to 502', () => {
    expect(run(new Trading212ApiError(500, '/p', '')).status).toBe(502);
    expect(run(new Trading212ApiError(503, '/p', '')).status).toBe(502);
  });

  it('maps anything else to 502 rather than 500', () => {
    const { status, body } = run(new Trading212ApiError(418, '/p', ''));
    expect(status).toBe(502);
    expect(body.message).toContain('418');
  });

  it('never leaks the upstream response body', () => {
    const { body } = run(
      new Trading212ApiError(500, '/summary', 'apiKey=secret-value'),
    );
    expect(JSON.stringify(body)).not.toContain('secret-value');
  });
});
