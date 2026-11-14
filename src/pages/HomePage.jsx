import { useQuery } from '@tanstack/react-query';
import { Lock, Plus, Shuffle } from 'lucide-react';
import { useState } from 'react';
import { getMyPlaylists, getRandomPlaylists, getRandomTracks } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { Screen } from '@/app/layout/Layouts';
import { Button, TextLink } from '@/components/Button';
import { CardGrid, EmptySlot, PlaylistCard, PlaylistCardSkeleton } from '@/components/PlaylistCard';
import { Section } from '@/components/Section';
import { SongList, SongListSkeleton } from '@/components/SongList';
import { EmptyState, ErrorState } from '@/components/States';
import { useAuth } from '@/features/auth/context';
import { useFavorites } from '@/features/favorites/context';
import { AddToPlaylistMenu } from '@/features/playlists/AddToPlaylistMenu';
import { useCreatePlaylist } from '@/features/playlists/context';
import { byOwner, favoriteCount, greeting, songCount } from '@/lib/format';
import { MAX_FAVORITES, MAX_PLAYLISTS } from '@/lib/limits';
import { firstName } from '@/lib/text';
import styles from './Pages.module.css';

const skeletonCards = (n) => Array.from({ length: n }, (_, i) => <PlaylistCardSkeleton key={i} />);

function FavoritesSection() {
  const { user } = useAuth();
  const { favorites, isLoading, isError, retry } = useFavorites();
  const slots = Array.from({ length: Math.max(0, MAX_FAVORITES - favorites.length) }, (_, i) => (
    <EmptySlot key={`slot-${i}`} />
  ));
  return (
    <Section
      id="favorites"
      title="Your favorites"
      count={
        <>
          <b>{favorites.length}</b> of {MAX_FAVORITES} · public, A–Z
        </>
      }
      note={
        !isLoading &&
        favorites.length === 0 && (
          <p className="muted">Favorite up to 5 playlists. They&apos;re public and appear on your profile.</p>
        )
      }
    >
      {isError ? (
        <ErrorState onRetry={retry} />
      ) : (
        <CardGrid columns="five" label="Your favorites">
          {isLoading
            ? skeletonCards(5)
            : [
                ...favorites.map((p) => (
                  <PlaylistCard
                    key={p.playlist_id}
                    playlist={p}
                    meta={`${byOwner(p.owner, user)} · ${songCount(p.track_count)}`}
                  />
                )),
                ...slots,
              ]}
        </CardGrid>
      )}
    </Section>
  );
}

function SongsSection() {
  const [seed, setSeed] = useState(0);
  const query = useQuery({
    queryKey: queryKeys.randomTracks(6, seed),
    queryFn: ({ signal }) => getRandomTracks({ limit: 6 }, signal),
    staleTime: Infinity,
  });
  return (
    <Section
      id="songs"
      title="Songs for you"
      actions={
        <>
          <Button variant="ghost" size="sm" icon={Shuffle} onClick={() => setSeed((s) => s + 1)}>
            Shuffle
          </Button>
          <TextLink to="/songs">See all →</TextLink>
        </>
      }
    >
      {query.isPending ? (
        <SongListSkeleton count={6} />
      ) : query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : (
        <SongList
          label="Songs for you"
          showHeader={false}
          dimmed={query.isFetching}
          rows={query.data.items.map((track, i) => ({ key: track.track_id, number: i + 1, track }))}
          renderAction={({ track }) => <AddToPlaylistMenu track={track} />}
        />
      )}
    </Section>
  );
}

function DiscoverSection() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.randomPlaylists(4, 0),
    queryFn: ({ signal }) => getRandomPlaylists({ limit: 4 }, signal),
    staleTime: Infinity,
  });
  return (
    <Section
      id="discover"
      title="Playlists to discover"
      actions={<TextLink to="/discover">See all →</TextLink>}
    >
      {query.isPending ? (
        <CardGrid columns="shelf" label="Playlists to discover">
          {skeletonCards(4)}
        </CardGrid>
      ) : query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : query.data.items.length === 0 ? (
        <EmptyState title="You've favorited everything we found">Check back later.</EmptyState>
      ) : (
        <CardGrid columns="shelf" label="Playlists to discover">
          {query.data.items.map((p) => (
            <PlaylistCard
              key={p.playlist_id}
              playlist={p}
              meta={`${byOwner(p.owner, user)} · ${songCount(p.track_count)}`}
            />
          ))}
        </CardGrid>
      )}
    </Section>
  );
}

function OtherPlaylistsSection() {
  const { user } = useAuth();
  const { open: openCreate, atLimit } = useCreatePlaylist();
  const query = useQuery({
    queryKey: queryKeys.myPlaylistsFor({ role: 'owner', sort: 'created' }),
    queryFn: ({ signal }) => getMyPlaylists({ role: 'owner', sort: 'created' }, signal),
  });
  const others = (query.data?.items ?? []).filter((p) => !p.is_favorite);
  const owned = query.data?.total ?? user.owned_playlist_count ?? 0;

  return (
    <Section
      id="mine"
      title="Your other playlists"
      count={
        <>
          <b>{owned}</b> of {MAX_PLAYLISTS}
        </>
      }
      note={
        <p className={styles.privNote}>
          <Lock size={16} aria-hidden="true" />
          <span>Private unless someone has them as a favorite. Favorite one to make it public.</span>
        </p>
      }
    >
      {query.isPending ? (
        <CardGrid label="Your other playlists">{skeletonCards(6)}</CardGrid>
      ) : query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : others.length === 0 ? (
        <EmptyState
          title="No other playlists"
          action={
            !atLimit && (
              <Button variant="primary" size="sm" icon={Plus} onClick={() => openCreate()}>
                New playlist
              </Button>
            )
          }
        >
          Make one with New playlist.
        </EmptyState>
      ) : (
        <CardGrid label="Your other playlists">
          {others.map((p) => (
            <PlaylistCard
              key={p.playlist_id}
              playlist={p}
              meta={
                p.visibility === 'public'
                  ? `${songCount(p.track_count)} · Public · ${favoriteCount(p.follower_count)}`
                  : songCount(p.track_count)
              }
            />
          ))}
        </CardGrid>
      )}
    </Section>
  );
}

/** S3 Home: a short summary of everything. Each section loads (and fails) on its own. */
export default function HomePage() {
  const { user } = useAuth();
  const [hello] = useState(() => greeting(new Date()));
  return (
    <Screen>
      <h1 className={`disp ${styles.greet}`}>
        {hello}, {firstName(user.display_name)}
      </h1>
      <FavoritesSection />
      <SongsSection />
      <DiscoverSection />
      <OtherPlaylistsSection />
    </Screen>
  );
}
