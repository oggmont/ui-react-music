import { PageLoader } from '@/components/Skeleton';
import { AppLayout, AuthLayout, RequireAuth, RootLayout } from './layout/Layouts';
import { NotFoundPage, RouteError } from './layout/RouteError';
import { importFresh } from './staleBuild';

/**
 * Code-split each screen: its module loads the first time its route matches. If the chunk is gone
 * because a new build was deployed, the page reloads once (see staleBuild.js).
 */
const page = (load) => async () => ({ Component: (await importFresh(load)).default });

/** Routes from UI-Design.md § Information architecture. */
export const routes = [
  {
    Component: RootLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: PageLoader,
    children: [
      {
        Component: AuthLayout,
        children: [
          { path: 'login', lazy: page(() => import('@/pages/LoginPage')) },
          { path: 'signup', lazy: page(() => import('@/pages/SignupPage')) },
        ],
      },
      {
        Component: AppLayout,
        children: [
          {
            Component: RequireAuth,
            children: [
              { index: true, lazy: page(() => import('@/pages/HomePage')) },
              { path: 'songs', lazy: page(() => import('@/pages/SongsPage')) },
              { path: 'discover', lazy: page(() => import('@/pages/DiscoverPage')) },
              {
                path: 'me',
                lazy: async () => ({
                  Component: (await importFresh(() => import('@/pages/ProfilePage'))).MeRedirect,
                }),
              },
            ],
          },
          // Public: a shared link works for signed-out visitors (S7, S8).
          { path: 'playlists/:playlistId', lazy: page(() => import('@/pages/PlaylistPage')) },
          { path: 'u/:username', lazy: page(() => import('@/pages/ProfilePage')) },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
