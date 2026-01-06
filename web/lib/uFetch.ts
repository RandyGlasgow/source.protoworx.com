import { up } from 'up-fetch';
import { getTimeout } from './time';

export const uFetch = up(fetch, () => ({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  timeout: getTimeout('10s'),
}));
