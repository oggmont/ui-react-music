import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ellipsis, Link2, Lock, Music, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { isApiError } from '@/api/client';
import {
  addTracks,
  deletePlaylist,
  getPlaylist,
  getPlaylistTracks,
  removeTrackAt,
  updatePlaylist,
} from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { Screen } from '@/app/layout/Layouts';
import { Avatar } from '@/components/Avatar';
import { Button, ButtonLink, IconButton } from '@/components/Button';
import { Cover } from '@/components/Cover';
import { ConfirmDialog } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { SongList, SongListSkeleton } from '@/components/SongList';
import { EmptyState, ErrorState } from '@/components/States';
import { useAuth } from '@/features/auth/context';
import { useFavorites } from '@/features/favorites/context';
import { FavoriteButton } from '@/features/favorites/FavoriteHeart';
import { AddToPlaylistMenu } from '@/features/playlists/AddToPlaylistMenu';
import { playlistFormFailure } from '@/features/playlists/errors';
import { PlaylistFormDialog } from '@/features/playlists/PlaylistFormDialog';
import { useToast } from '@/features/toast/context';
import { favoriteCount, formatTotalTime, songCount } from '@/lib/format';
import { MAX_TRACKS } from '@/lib/limits';
import { isOwnedBy, othersWithFavorite, visibilityBadge } from '@/lib/rules';
import styles from './PlaylistPage.module.css';

const notFoundRetry = (count, error) => !isApiError(error, 404) && count < 2;
const CHANGED = "This playlist changed. We've reloaded it.";

function NotFound({ signedIn }) {
  return (
    <Screen>
      <EmptyState
        title="We can't find this playlist"
        action={
          signedIn && (
            <ButtonLink variant="primary" size="sm" to="/">
              Go to Home
            </ButtonLink>
          )
        }
      >
        It may have been deleted or made private.
      </EmptyState>
    </Screen>
  );
}

function PlaylistSkeleton() {
  return (
    <Screen>
      <div className={styles.head} aria-hidden="true">
        <Skeleton height={220} width={220} radius="var(--r-cover)" className={styles.coverSkeleton} />
        <div className={styles.headText}>
          <Skeleton width={180} height={12} />
          <Skeleton width="60%" height={56} />
          <Skeleton width={200} />
        </div>
      </div>
      <SongListSkeleton count={8} />
    </Screen>
  );
}

function RowMenu({ entry, onRemove }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton icon={Ellipsis} label={`More for ${entry.track.name}`} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={`${styles.menu} sheet-on-phone`} align="end" sideOffset={4}>
          <DropdownMenu.Item
            className={`${styles.menuItem} ${styles.danger}`}
            onSelect={() => onRemove(entry)}
          >
            <Trash2 size={20} aria-hidden="true" />
            Remove from playlist
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** S7 Playlist: what's in it, who made it, and what you can do with it. */
export default function PlaylistPage() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const { isFavorite } = useFavorites();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const detailKey = queryKeys.playlist(playlistId);
  const tracksKey = queryKeys.playlistTracks(playlistId);
  const detail = useQuery({
    queryKey: detailKey,
    queryFn: ({ signal }) => getPlaylist(playlistId, { signal }),
    retry: notFoundRetry,
  });
  const tracks = useQuery({
    queryKey: tracksKey,
    queryFn: ({ signal }) => getPlaylistTracks(playlistId, { signal }),
    retry: notFoundRetry,
  });

  if (detail.isPending) return <PlaylistSkeleton />;
  if (detail.isError) {
    if (isApiError(detail.error, 404)) return <NotFound signedIn={Boolean(user)} />;
    return (
      <Screen>
        <ErrorState message="Couldn't load this playlist." onRetry={detail.refetch} />
      </Screen>
    );
  }

  const playlist = detail.data;
  const id = playlist.playlist_id;
  const owner = isOwnedBy(playlist, user);
  const favorite = Boolean(user) && isFavorite(id);
  const isPublic = playlist.visibility === 'public';
  const badge = visibilityBadge(playlist, { isOwner: owner, isFavorite: favorite });
  const entries = tracks.data?.items ?? [];
  const n = playlist.track_count ?? entries.length;
  const version = tracks.data?.version ?? playlist.version;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: detailKey });
    queryClient.invalidateQueries({ queryKey: queryKeys.myPlaylists });
    queryClient.invalidateQueries({ queryKey: queryKeys.me, exact: true });
  }

  async function copyLink() {
    const url = `${window.location.origin}/playlists/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ message: 'Link copied' });
    } catch {
      toast({ message: `Copy this link: ${url}`, variant: 'info' });
    }
  }

  async function removeEntry(entry) {
    const snapshot = queryClient.getQueryData(tracksKey);
    queryClient.setQueryData(tracksKey, (page) =>
      page ? { ...page, items: page.items.filter((e) => e.position !== entry.position) } : page,
    );
    try {
      const removed = await removeTrackAt(id, entry.position, version);
      toast({
        message: `Removed “${entry.track.name}”`,
        action: {
          label: 'Undo',
          onAction: async () => {
            try {
              await addTracks(id, [entry.track.track_id], removed.version, entry.position);
            } catch {
              toast({ message: `Couldn't put “${entry.track.name}” back.`, variant: 'error' });
            } finally {
              refresh();
            }
          },
        },
      });
    } catch (error) {
      queryClient.setQueryData(tracksKey, snapshot);
      toast({
        message: isApiError(error, 412) ? CHANGED : `Couldn't remove the song. ${error.message}`,
        variant: 'error',
      });
    } finally {
      refresh();
    }
  }

  async function saveDetails(_values, changes) {
    if (Object.keys(changes).length === 0) {
      setEditing(false);
      return;
    }
    try {
      const updated = await updatePlaylist(id, changes, playlist.version);
      queryClient.setQueryData(detailKey, updated);
      refresh();
      setEditing(false);
      toast({ message: 'Saved' });
    } catch (error) {
      if (isApiError(error, 412)) {
        const fresh = await getPlaylist(id);
        queryClient.setQueryData(detailKey, fresh);
        throw {
          reload: { name: fresh.name, description: fresh.description ?? '' },
          formError: 'This playlist changed while you were editing. Check the details and save again.',
        };
      }
      throw playlistFormFailure(error);
    }
  }

  async function removePlaylist() {
    setDeleting(true);
    try {
      await deletePlaylist(id);
      setConfirmDelete(false);
      toast({ message: `Deleted ${playlist.name}` });
      navigate('/');
      // Mark it stale without refetching: this page may still be mounted until the navigation
      // commits, and a later visit refetches and shows "not found".
      queryClient.invalidateQueries({ queryKey: detailKey, refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: queryKeys.myFavorites });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPlaylists });
      queryClient.invalidateQueries({ queryKey: queryKeys.me, exact: true });
    } catch (error) {
      setDeleting(false);
      toast({ message: `Couldn't delete ${playlist.name}. ${error.message}`, variant: 'error' });
    }
  }

  const others = othersWithFavorite(playlist, favorite);
  const rows = entries.map((entry, i) => ({ key: entry.position, number: i + 1, track: entry.track, entry }));
  const renderAction = owner
    ? ({ entry }) => <RowMenu entry={entry} onRemove={removeEntry} />
    : user
      ? ({ track }) => <AddToPlaylistMenu track={track} />
      : undefined;
  const hidden = (tracks.data?.total ?? 0) - entries.length;

  return (
    <Screen>
      <div className={styles.head}>
        <Cover playlist={playlist} className={styles.cover} />
        <div className={styles.headText}>
          <span className={`lbl-caps ${styles.badge}`}>
            {badge.locked && <Lock size={14} aria-hidden="true" />}
            {badge.text}
          </span>
          <h1 className={`disp ${styles.hero}`}>{playlist.name}</h1>
          <Link to={`/u/${playlist.owner.username}`} className={styles.owner}>
            <Avatar user={playlist.owner} size={32} />
            <span>{playlist.owner.display_name}</span>
          </Link>
          {playlist.description && <p className={styles.description}>{playlist.description}</p>}
          <div className={`${styles.meta} num`}>
            {songCount(n)} · {formatTotalTime(playlist.duration_ms)} ·{' '}
            {favoriteCount(playlist.follower_count ?? 0)}
          </div>
          <div className={styles.actions}>
            <FavoriteButton playlist={playlist} />
            <Button
              icon={Link2}
              onClick={copyLink}
              disabledReason={isPublic ? undefined : "Private playlists can't be shared."}
              aria-describedby={isPublic ? undefined : 'private-hint'}
            >
              Copy link
            </Button>
            {owner && (
              <>
                <Button icon={Pencil} onClick={() => setEditing(true)}>
                  Edit details
                </Button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <IconButton icon={Ellipsis} label={`More for ${playlist.name}`} />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className={`${styles.menu} sheet-on-phone`}
                      align="end"
                      sideOffset={4}
                    >
                      <DropdownMenu.Item className={styles.menuItem} onSelect={() => setEditing(true)}>
                        <Pencil size={20} aria-hidden="true" />
                        Edit details
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className={`${styles.menuItem} ${styles.danger}`}
                        onSelect={() => setConfirmDelete(true)}
                      >
                        <Trash2 size={20} aria-hidden="true" />
                        Delete playlist
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            )}
          </div>
          {owner && !isPublic && (
            <p id="private-hint" className={styles.hint}>
              Private playlists can&apos;t be shared. Favorite it to make it public.
            </p>
          )}
        </div>
      </div>

      {tracks.isPending ? (
        <SongListSkeleton count={Math.min(n || 6, 10)} />
      ) : tracks.isError ? (
        <ErrorState message="Couldn't load the songs." onRetry={tracks.refetch} />
      ) : entries.length === 0 ? (
        owner ? (
          <EmptyState
            title="No songs yet"
            action={
              <ButtonLink variant="primary" size="sm" to="/songs" icon={Music}>
                Find songs
              </ButtonLink>
            }
          >
            Add songs from Home or the Songs screen.
          </EmptyState>
        ) : (
          <EmptyState title="This playlist has no songs yet" />
        )
      ) : (
        <div>
          <SongList
            label={`Songs in ${playlist.name}`}
            rows={rows}
            renderAction={renderAction}
            footer={hidden > 0 && <div className={styles.more}>… and {hidden} more songs</div>}
          />
          {owner && (
            <div className={styles.capacity}>
              <span className="num">
                <b className={styles.strong}>{n}</b> / {MAX_TRACKS} songs
              </span>
              <span className={styles.meter} aria-hidden="true">
                <i style={{ width: `${Math.min(100, (n / MAX_TRACKS) * 100)}%` }} />
              </span>
              {n >= MAX_TRACKS && <b className={styles.full}>Full</b>}
            </div>
          )}
        </div>
      )}

      {editing && (
        <PlaylistFormDialog
          mode="edit"
          initial={{ name: playlist.name, description: playlist.description ?? '' }}
          onSubmit={saveDetails}
          onClose={() => setEditing(false)}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${playlist.name}?`}
        confirmLabel="Delete playlist"
        confirmVariant="danger"
        confirmIcon={Trash2}
        busy={deleting}
        onConfirm={removePlaylist}
      >
        <p>
          {n === 1 ? 'Its 1 song is removed from it.' : `Its ${n} songs are removed from it.`}
          {others > 0 &&
            (others === 1
              ? ' 1 other person has it in their favorites and will lose it.'
              : ` ${others} other people have it in their favorites and will lose it.`)}{' '}
          This can&apos;t be undone.
        </p>
      </ConfirmDialog>
    </Screen>
  );
}
