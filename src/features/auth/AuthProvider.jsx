import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { isApiError } from '@/api/client';
import * as endpoints from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { clearSession, getRefreshToken, hasSession, onSessionEnd, saveTokens } from '@/api/session';
import { AuthContext } from './context';

/**
 * Who is signed in. The current user is the `me` query: `null` when signed out. On start, a stored
 * refresh token is exchanged for an access token (inside the API client) before `GET /me`.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: async ({ signal }) => {
      if (!hasSession()) return null;
      try {
        return await endpoints.getMe({ signal });
      } catch (error) {
        if (isApiError(error, 401)) {
          clearSession('expired');
          return null;
        }
        throw error;
      }
    },
    staleTime: 60_000,
    retry: (count, error) => isApiError(error, 0) && count < 2,
  });

  // When the session ends (logout, or a refresh that fails), drop everything that belongs to the user.
  useEffect(
    () =>
      onSessionEnd(() => {
        queryClient.setQueryData(queryKeys.me, null);
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] !== 'me' || query.queryKey.length > 1,
        });
      }),
    [queryClient],
  );

  async function login(username, password) {
    const tokens = await endpoints.login(username, password);
    saveTokens(tokens);
    const me = await endpoints.getMe();
    queryClient.setQueryData(queryKeys.me, me);
    return me;
  }

  async function signup(account) {
    await endpoints.signUp(account);
    return login(account.username, account.password);
  }

  async function logout() {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await endpoints.logout(refreshToken);
    } catch {
      // The session ends on this device either way.
    } finally {
      clearSession('logout');
    }
  }

  const status = meQuery.isPending
    ? 'loading'
    : meQuery.isError
      ? 'error'
      : meQuery.data
        ? 'signedIn'
        : 'signedOut';

  const value = {
    user: meQuery.data ?? null,
    status,
    error: meQuery.error,
    login,
    signup,
    logout,
    retry: () => meQuery.refetch(),
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
