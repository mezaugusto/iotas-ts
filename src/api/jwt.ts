/**
 * Check whether a JWT token has expired based on its `exp` claim.
 *
 * WARNING: This performs NO signature verification. It must NOT be used
 * for authentication or authorization decisions.
 */
export function isTokenExpired(token: string): boolean {
  const payload = token.split('.')[1];
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp: number };
  // Date.now() returns Unix time in milliseconds, while JWT exp is defined in seconds, hence the division by 1000.
  return decoded.exp < Date.now() / 1000;
}
