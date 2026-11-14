import { useQuery } from '@tanstack/react-query';
import { LogOut, Pencil } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { isApiError } from '@/api/client';
import { getCountries, getUser, getUserFavorites } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { Screen } from '@/app/layout/Layouts';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CardGrid, EmptySlot, PlaylistCard, PlaylistCardSkeleton } from '@/components/PlaylistCard';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/States';
import { useAuth } from '@/features/auth/context';
import { useFavorites } from '@/features/favorites/context';
import { byOwner, songCount } from '@/lib/format';
import { MAX_FAVORITES } from '@/lib/limits';
import { firstName } from '@/lib/text';
import styles from './ProfilePage.module.css';

const notFoundRetry = (count, error) => !isApiError(error, 404) && count < 2;

/** S8 Profile: who someone is, through their five favorite playlists (always public, A–Z). */
export default function ProfilePage() {
  const { username } = useParams();
  const { user, logout } = useAuth();
  const mine = useFavorites();
  const navigate = useNavigate();
  const isMe = user?.username === username;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const profile = useQuery({
    queryKey: queryKeys.user(username),
    queryFn: ({ signal }) => getUser(username, { signal }),
    retry: notFoundRetry,
  });
  const theirs = useQuery({
    queryKey: queryKeys.userFavorites(username),
    queryFn: ({ signal }) => getUserFavorites(username, { signal }),
    enabled: !isMe,
    retry: notFoundRetry,
  });
  const countries = useQuery({
    queryKey: queryKeys.countries,
    queryFn: ({ signal }) => getCountries({ signal }),
    staleTime: Infinity,
  });

  if (profile.isError && isApiError(profile.error, 404)) {
    return (
      <Screen>
        <EmptyState title={`There's no one called @${username} here.`} />
      </Screen>
    );
  }
  if (profile.isError) {
    return (
      <Screen>
        <ErrorState message="Couldn't load this profile." onRetry={profile.refetch} />
      </Screen>
    );
  }

  const person = profile.data;
  const country = countries.data?.find((c) => c.code === person?.country_code)?.description;
  const favorites = isMe ? mine.favorites : (theirs.data ?? []);
  const loadingFavorites = isMe ? mine.isLoading : theirs.isPending;
  const favoritesError = isMe ? mine.isError : theirs.isError;
  const retryFavorites = isMe ? mine.retry : theirs.refetch;

  return (
    <Screen>
      <div className={styles.head}>
        {person ? (
          <Avatar user={person} size={128} className={styles.avatar} />
        ) : (
          <Skeleton width={128} height={128} radius="50%" className={styles.avatar} />
        )}
        <div className={styles.text}>
          {person ? (
            <>
              <h1 className={`disp ${styles.hero}`}>{person.display_name}</h1>
              <div className="muted">
                @{person.username}
                {country && ` · ${country}`}
              </div>
              {person.bio && <p>{person.bio}</p>}
              {isMe && (
                <div className={styles.actions}>
                  <Button size="sm" icon={Pencil} disabledReason="Coming after v1">
                    Edit profile
                  </Button>
                  <span className={styles.hint}>Coming after v1</span>
                  {/* Phones have no account menu: log out from your own profile (the Me tab). */}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={LogOut}
                    className={styles.logout}
                    onClick={handleLogout}
                  >
                    Log out
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <Skeleton width={320} height={56} />
              <Skeleton width={180} />
            </>
          )}
        </div>
      </div>

      <Section
        id="profile-favorites"
        title="Favorite playlists"
        count={
          isMe ? (
            <>
              <b>{favorites.length}</b> of {MAX_FAVORITES} · public, A–Z
            </>
          ) : (
            'public, A–Z'
          )
        }
      >
        {favoritesError ? (
          <ErrorState onRetry={retryFavorites} />
        ) : loadingFavorites ? (
          <CardGrid columns="five" label="Favorite playlists">
            {Array.from({ length: 5 }, (_, i) => (
              <PlaylistCardSkeleton key={i} />
            ))}
          </CardGrid>
        ) : favorites.length === 0 && !isMe ? (
          <EmptyState
            title={`${firstName(person?.display_name ?? username)} hasn't picked any favorites yet`}
          />
        ) : (
          <CardGrid columns="five" label="Favorite playlists">
            {[
              ...favorites.map((p) => (
                <PlaylistCard
                  key={p.playlist_id}
                  playlist={p}
                  meta={`${byOwner(p.owner, user)} · ${songCount(p.track_count)}`}
                />
              )),
              ...(isMe
                ? Array.from({ length: Math.max(0, MAX_FAVORITES - favorites.length) }, (_, i) => (
                    <EmptySlot key={`slot-${i}`} />
                  ))
                : []),
            ]}
          </CardGrid>
        )}
      </Section>
    </Screen>
  );
}

/** `/me` → `/u/{my username}`. */
export function MeRedirect() {
  const { user } = useAuth();
  return <Navigate to={`/u/${user.username}`} replace />;
}
