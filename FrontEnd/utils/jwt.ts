/**
 * JWT Utilities — Token decoding and expiry checking
 *
 * Provides lightweight functions to decode a JWT payload and check if the
 * token has expired, WITHOUT requiring a third-party JWT library.
 *
 * The JWT is structured as three base64url-encoded segments separated by
 * dots: `header.payload.signature`. We only need the payload (middle segment)
 * to read the `exp` (expiration) claim.
 */

/**
 * Decodes a base64url string to a UTF-8 string.
 *
 * JWT uses base64url encoding (not standard base64). This function:
 * 1. Converts base64url → base64 (replacing `-` with `+` and `_` with `/`)
 * 2. Adds padding if needed
 * 3. Decodes using `atob` (available globally in React Native 0.73+)
 * 4. Handles UTF-8 properly via `decodeURIComponent`
 *
 * @param base64url — The base64url-encoded string (the JWT payload segment).
 * @returns The decoded UTF-8 string, or null if decoding fails.
 */
const decodeBase64Url = (base64url: string): string | null => {
  try {
    // Convert base64url → base64
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

    // Pad with '=' to make the length a multiple of 4
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );

    // Decode base64 → binary string.
    // `atob` is available globally in React Native 0.73+ (Expo SDK 50+).
    // For older environments, we could fall back to a manual implementation,
    // but this project uses Expo SDK 54 / RN 0.81, so atob is always available.
    const binaryStr = atob(paddedBase64);

    // Convert binary string → UTF-8 string.
    // This is the standard pattern for decoding base64-encoded UTF-8 in JS.
    // Each byte is converted to %XX notation, then decodeURIComponent handles
    // the multi-byte UTF-8 sequences.
    const utf8Str = decodeURIComponent(
      binaryStr
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return utf8Str;
  } catch (error) {
    console.error('[jwt] Failed to decode base64url:', error);
    return null;
  }
};

/**
 * Decodes the payload of a JWT token.
 *
 * @param token — The JWT string (e.g. "eyJhbGciOi...eyJzdWIi....signature")
 * @returns The decoded payload object, or null if the token is malformed.
 */
export const decodeJwtPayload = (token: string): any | null => {
  try {
    // The payload is the second segment (index 1) of the dot-separated token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payloadBase64 = parts[1];
    const jsonStr = decodeBase64Url(payloadBase64);
    if (!jsonStr) {
      return null;
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('[jwt] Failed to decode JWT payload:', error);
    return null;
  }
};

/**
 * Checks whether a JWT token has expired.
 *
 * The backend sets `expiresIn: "1d"` (1 day), so the `exp` claim in the
 * payload is a Unix timestamp (seconds since epoch). We compare it against
 * the current time and add a 30-second safety margin to account for clock
 * skew between the client and server.
 *
 * @param token — The JWT string to check.
 * @returns `true` if the token is expired or invalid, `false` if it's still valid.
 */
export const isTokenExpired = (token: string | undefined | null): boolean => {
  if (!token || typeof token !== 'string') {
    return true;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return true;
  }

  // The `exp` claim is a Unix timestamp in SECONDS (not milliseconds).
  // If there's no `exp`, we can't verify expiry — treat as expired for safety.
  if (typeof payload.exp !== 'number') {
    return true;
  }

  // Current time in seconds, plus a 30-second safety margin to account for
  // network latency and clock skew. This prevents the edge case where the
  // token is about to expire (e.g., 5 seconds left) and by the time the
  // request reaches the backend, it's already expired.
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const SAFETY_MARGIN_SECONDS = 30;

  return payload.exp < nowInSeconds + SAFETY_MARGIN_SECONDS;
};

/**
 * Returns the expiration Date of a JWT, or null if it can't be determined.
 *
 * Useful for debugging and logging.
 */
export const getTokenExpiry = (token: string | undefined | null): Date | null => {
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return null;
  }

  // `exp` is in seconds; Date constructor expects milliseconds.
  return new Date(payload.exp * 1000);
};
