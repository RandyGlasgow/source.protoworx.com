import { up } from 'up-fetch';
import { getTimeout } from './time';

// #region agent log
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
fetch('http://127.0.0.1:7243/ingest/13c223f3-8ad3-4080-a57b-12fdda8a83f1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'uFetch.ts:5',
    message: 'API URL in uFetch config',
    data: {
      apiUrl: apiUrl || 'undefined',
      isUndefined: !apiUrl,
      isBuildTime: typeof window === 'undefined',
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'A',
  }),
}).catch(() => {});
// #endregion

export const uFetch = up(fetch, () => {
  // #region agent log
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  fetch('http://127.0.0.1:7243/ingest/13c223f3-8ad3-4080-a57b-12fdda8a83f1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'uFetch.ts:10',
      message: 'baseUrl factory called',
      data: { baseUrl: baseUrl || 'undefined', isUndefined: !baseUrl },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    }),
  }).catch(() => {});
  // #endregion
  return {
    baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    timeout: getTimeout('10s'),
  };
});
