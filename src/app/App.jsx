import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ToastProvider } from '@/features/toast/ToastProvider';
import { createQueryClient } from './queryClient';
import { routes } from './routes';
import { setReloadTarget } from './staleBuild';

// Data routers live outside React state (React Router docs).
const router = createBrowserRouter(routes);

// After a deploy, a stale chunk reloads the app at the page that was being opened.
setReloadTarget(() => {
  const next = router.state.navigation.location;
  return next ? `${next.pathname}${next.search}${next.hash}` : null;
});

export function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
    </QueryClientProvider>
  );
}
