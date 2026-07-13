/**
 * apiFetch — Centralized fetch wrapper with automatic token handling
 *
 * WHY THIS EXISTS:
 * The backend JWT expires after 1 day (see BackEnd/index.js: `expiresIn: "1d"`).
 * When the token expires, every authenticated API call returns 401
 * {"message": "Token inválido ou expirado"}.
 *
 * Before this utility existed, each screen handled 401s independently (or not
 * at all), which meant a user with an expired token would stay stuck in the
 * app seeing "Could not load businesses" / "Error fetching data" snackbars
 * on every screen — without being logged out or redirected to login.
 *
 * WHAT THIS DOES:
 * 1. Automatically adds the `Authorization: Bearer <token>` header to every
 *    request (so you don't have to repeat it in every fetch call).
 * 2. Detects 401 responses and triggers a global logout via the AuthContext.
 * 3. Returns the original Response object so callers can handle non-401
 *    cases (200, 400, 404, 500, etc.) exactly as before.
 *
 * USAGE (inside a React component):
 *   import { useApiFetch } from '@/utils/apiFetch';
 *
 *   const MyComponent = () => {
 *     const apiFetch = useApiFetch();
 *
 *     const loadData = async () => {
 *       const response = await apiFetch('/meusNegocios');
 *       if (response.ok) {
 *         const data = await response.json();
 *         // ...
 *       }
 *     };
 *   };
 *
 * IMPORTANT:
 * This hook must be called from within a React component tree that is
 * wrapped by <AuthProvider>.
 */

import { useCallback } from 'react';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook that returns a fetch function pre-configured with:
 * - The current user's JWT token in the Authorization header
 * - Automatic logout on 401 (expired/invalid token)
 *
 * @returns A function with the signature `(url, options?) => Promise<Response>`.
 *          The `url` should be a path like `/meusNegocios` (without API_URL prefix).
 *          The Authorization header is added automatically — do NOT set it in options.
 */
export const useApiFetch = () => {
  const { user, logout } = useAuth();

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      // Build the full URL (allow absolute URLs too, for flexibility)
      const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

      // Inject the Authorization header
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      // --- 401 Handling ---
      // When the backend returns 401, the token is either expired or invalid.
      // We trigger logout so the user is redirected to the login screen
      // instead of being stuck with error snackbars on every screen.
      if (response.status === 401) {
        console.warn(
          '[apiFetch] Received 401 Unauthorized — token is expired or invalid. ' +
            'Triggering automatic logout.',
        );
        // Call logout asynchronously (don't await — we still return the response
        // so the caller's code doesn't hang).
        try {
          logout();
        } catch (e) {
          console.error('[apiFetch] Error during auto-logout:', e);
        }
      }

      return response;
    },
    [user?.token, logout],
  );

  return apiFetch;
};

/**
 * Standalone version of apiFetch for use OUTSIDE React components
 * (e.g. in utility functions, event handlers, or background tasks).
 *
 * This version does NOT auto-logout on 401 — the caller must handle it.
 *
 * @param url — The API path (e.g. "/meusNegocios"). Will be appended to API_URL.
 * @param options — Standard fetch options.
 * @param token — The JWT token to send. If null, no Authorization header is added.
 * @returns The standard Response object.
 */
export const apiFetchWithToken = async (
  url: string,
  options: RequestInit = {},
  token: string | undefined | null,
): Promise<Response> => {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(fullUrl, {
    ...options,
    headers,
  });
};
