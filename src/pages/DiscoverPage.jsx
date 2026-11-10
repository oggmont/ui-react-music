import { useInfiniteQuery } from '@tanstack/react-query';
import { Shuffle } from 'lucide-react';
import { useState } from 'react';
import { getRandomPlaylists } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { Screen } from '@/app/layout/Layouts';
import { Button } from '@/components/Button';
import { CardGrid, PlaylistCard, PlaylistCardSkeleton } from '@/components/PlaylistCard';
import { EmptyState, ErrorState } from '@/components/States';
import { useAuth } from '@/features/auth/context';
import { useFavorites } from '@/features/favorites/context';
import { byOwner, songCount } from '@/lib/format';
import { MAX_FAVORITES } from '@/lib/limits';
import styles from './Pages.module.css';

const LIMIT = 12;

/**
 * S6 Discover: public playlists from other people. A playlist you just favorited stays on screen,
 * with a filled heart, until the next Shuffle.
 */
export default function DiscoverPage() {
  const { user } = useAuth();
  const { count } = useFavorites();
  const [seed, setSeed] = useState(0);
  const query = useInfiniteQuery({
    queryKey: queryKeys.randomPlaylists(LIMIT, seed),
    queryFn: ({ pageParam, signal }) => getRandomPlaylists({ limit: LIMIT, exclude: pageParam }, signal),
    initialPageParam: [],
    getNextPageParam: (last, pages) =>
      last.items.length === LIMIT ? pages.flatMap((page) => page.items.map((p) => p.playlist_id)) : undefined,
    staleTime: Infinity,
  });
  const playlists = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen>
      <div className={styles.pageHead}>
        <div>
          <h1 className="disp">Discover playlists</h1>
          <p className="muted">
            Public playlists from other people. Your favorites:{' '}
            <b className={`${styles.strong} num`}>
              {count} of {MAX_FAVORITES}
            </b>
          </p>
        </div>
        <span className={styles.spacer} />
        <Button icon={Shuffle} onClick={() => setSeed((s) => s + 1)}>
          Shuffle
        </Button>
      </div>
      {query.isPending ? (
        <CardGrid label="Playlists">
          {Array.from({ length: LIMIT }, (_, i) => (
            <PlaylistCardSkeleton key={i} />
          ))}
        </CardGrid>
      ) : query.isError ? (
        <ErrorState message="Couldn't load playlists." onRetry={query.refetch} />
      ) : playlists.length === 0 ? (
        <EmptyState title="You've favorited everything we found">
          Check back later for new playlists.
        </EmptyState>
      ) : (
        <>
          <CardGrid label="Playlists">
            {playlists.map((p) => (
              <PlaylistCard
                key={p.playlist_id}
                playlist={p}
                meta={`${byOwner(p.owner, user)} · ${songCount(p.track_count)}`}
              />
            ))}
          </CardGrid>
          {query.hasNextPage && (
            <div className={styles.center}>
              <Button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </Screen>
  );
}
