import { request, setTokens } from '../http';
import type { AuthTokens } from '../types';

export async function register(
  email: string,
  password: string,
): Promise<AuthTokens> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<AuthTokens> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export { setTokens };
