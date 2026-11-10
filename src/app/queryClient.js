import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/api/client';

/** Don't retry what retrying can't fix (4xx); retry network and server errors twice. */
function retry(failureCount, error) {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 15_000, retry, refetchOnWindowFocus: true },
      mutations: { retry: false },
    },
  });
}
