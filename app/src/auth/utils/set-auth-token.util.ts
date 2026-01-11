import { Response } from 'express';

/**
 * Sets the authentication token in both cookie and header
 * @param res - Express response object
 * @param token - JWT token to set
 */
export function setAuthToken(res: Response, token: string): void {
  // Set httpOnly cookie for defense in depth
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  // Set the header bearer token
  res.setHeader('Authorization', `Bearer ${token}`);
}
