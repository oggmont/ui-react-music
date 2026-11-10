import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { saveTokens } from '@/api/session';
import { createQueryClient } from '@/app/queryClient';
import { routes } from '@/app/routes';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ToastProvider } from '@/features/toast/ToastProvider';
import { tokens } from './fixtures';

export function testQueryClient() {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } });
  return client;
}

/** Providers without a router, for components that don't navigate. */
export function renderWithProviders(ui) {
  const queryClient = testQueryClient();
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { ...result, user, queryClient };
}

/**
 * The whole app at `path`, in a memory router. `signedIn: true` stores a session first, so
 * the app calls `GET /me` (mock it).
 */
export function renderApp(path, { signedIn = false } = {}) {
  if (signedIn) saveTokens(tokens);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = renderWithProviders(<RouterProvider router={router} />);
  return { ...result, router };
}

/**
 * Load the lazy page modules up front (call in `beforeAll`), so per-test timing measures the
 * UI rather than the first transform of a route module.
 */
export function preloadPages() {
  return Promise.all([
    import('@/pages/LoginPage'),
    import('@/pages/SignupPage'),
    import('@/pages/HomePage'),
    import('@/pages/SongsPage'),
    import('@/pages/DiscoverPage'),
    import('@/pages/PlaylistPage'),
    import('@/pages/ProfilePage'),
  ]);
}
