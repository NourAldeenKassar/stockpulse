import { Catch, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Trading212ApiError } from './trading212.error.js';

/**
 * Turns an upstream Trading212 failure into a response that says what went
 * wrong.
 *
 * Trading212ApiError is a plain Error, so without this it reaches Nest's
 * default handler and becomes a bare "Internal server error" — which tells the
 * user nothing and suggests the bug is ours when the upstream is simply rate
 * limiting or down.
 */
@Catch(Trading212ApiError)
export class Trading212ExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(Trading212ExceptionFilter.name);

  catch(error: Trading212ApiError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();

    const { status, message } = this.describe(error);
    this.logger.warn(`${error.status} on ${error.path} -> ${status}`);

    response.status(status).json({
      statusCode: status,
      error: 'Trading212',
      message,
    });
  }

  private describe(error: Trading212ApiError): {
    status: number;
    message: string;
  } {
    if (error.isAuthFailure) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message:
          'Trading212 rejected the stored API credentials. Reconnect the account in Settings.',
      };
    }

    if (error.status === 429) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message:
          'Trading212 is rate limiting us. The data will load again shortly.',
      };
    }

    if (error.status >= 500) {
      return {
        status: HttpStatus.BAD_GATEWAY,
        message: 'Trading212 is currently unavailable. Try again shortly.',
      };
    }

    return {
      status: HttpStatus.BAD_GATEWAY,
      message: `Trading212 returned ${error.status}.`,
    };
  }
}
