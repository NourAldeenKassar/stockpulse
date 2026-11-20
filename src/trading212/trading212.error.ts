export class Trading212ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body: string,
  ) {
    super(`Trading212 API error ${status} on ${path}`);
    this.name = 'Trading212ApiError';
  }

  get isAuthFailure(): boolean {
    return this.status === 401 || this.status === 403;
  }
}
