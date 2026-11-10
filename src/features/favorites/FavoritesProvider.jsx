import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isApiError } from '@/api/client';
import { favoritePlaylist, getMyFavorites, unfavoritePlaylist } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { ConfirmDialog } from '@/components/Modal';
import { useAuth } from '@/features/auth/context';
import { useToast } from '@/features/toast/context';
import { MAX_FAVORITES } from '@/lib/limits';
import { favoriteMessage, isLastFavorite, isOwnedBy, unfavoriteMessage } from '@/lib/rules';
import { FavoritesContext } from './context';
import { LoginPromptDialog } from './LoginPromptDialog';
import { ReplaceFavoriteDialog } from './ReplaceFavoriteDialog';

/** Remove a playlist from cached random samples (plain `{ items }` or infinite `{ pages }`). */
function dropFromSamples(data, playlistId) {
  if (!data) return data;
  const keep = (page) => ({ ...page, items: page.items.filter((p) => p.playlist_id !== playlistId) });
  return data.pages ? { ...data, pages: data.pages.map(keep) } : keep(data);
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [dialog, setDialog] = useState(null);

  const favoritesQuery = useQuery({
    queryKey: queryKeys.myFavorites,
    queryFn: ({ signal }) => getMyFavorites({ signal }),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
  const favorites = user ? (favoritesQuery.data ?? []) : [];
  const favoriteIds = new Set(favorites.map((f) => f.playlist_id));

  function refresh(...playlistIds) {
    queryClient.invalidateQueries({ queryKey: queryKeys.myFavorites });
    queryClient.invalidateQueries({ queryKey: queryKeys.me, exact: true });
    queryClient.invalidateQueries({ queryKey: queryKeys.myPlaylists });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    for (const id of playlistIds) {
      if (id != null) queryClient.invalidateQueries({ queryKey: queryKeys.playlist(id), exact: true });
    }
  }

  async function withPending(id, task) {
    setPendingIds((ids) => new Set(ids).add(id));
    try {
      return await task();
    } finally {
      setPendingIds((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }
  }

  function handleError(error, playlist) {
    if (isApiError(error, 422, 'favorite_limit_reached')) {
      // The count here was out of date (another tab, say): ask which one to swap out.
      queryClient.invalidateQueries({ queryKey: queryKeys.myFavorites });
      setDialog({ type: 'replace', playlist });
      return;
    }
    if (isApiError(error, 404)) {
      queryClient.setQueriesData({ queryKey: ['playlists', 'random'] }, (data) =>
        dropFromSamples(data, playlist.playlist_id),
      );
      toast({ message: 'That playlist is no longer public.', variant: 'error' });
      refresh(playlist.playlist_id);
      return;
    }
    toast({ message: `Couldn't update your favorites. ${error.message}`, variant: 'error' });
  }

  async function favorite(playlist, replaced) {
    const id = playlist.playlist_id;
    await withPending(id, async () => {
      try {
        const state = await favoritePlaylist(id, replaced?.playlist_id);
        const isOwn = isOwnedBy(playlist, user);
        if (replaced) {
          const nowPrivate = state.replaced?.visibility === 'private';
          toast({
            message: `Replaced ${replaced.name} with ${playlist.name}${nowPrivate ? ` · ${replaced.name} is now private` : ''}`,
          });
        } else {
          toast({ message: favoriteMessage(playlist.name, { isOwn, state }) });
        }
        refresh(id, replaced?.playlist_id);
      } catch (error) {
        handleError(error, playlist);
      }
    });
  }

  async function unfavorite(playlist) {
    const id = playlist.playlist_id;
    await withPending(id, async () => {
      try {
        const state = await unfavoritePlaylist(id);
        const isOwn = isOwnedBy(playlist, user);
        const lostAccess = !isOwn && state.visibility === 'private';
        toast({
          message: lostAccess
            ? `Removed ${playlist.name} from favorites. It's now private.`
            : unfavoriteMessage(playlist.name, { isOwn, state }),
          action: lostAccess ? undefined : { label: 'Undo', onAction: () => favorite(playlist) },
        });
        refresh(id);
        if (lostAccess && location.pathname === `/playlists/${id}`) navigate('/');
      } catch (error) {
        handleError(error, playlist);
      }
    });
  }

  function toggle(playlist) {
    if (!user) {
      setDialog({ type: 'login' });
      return;
    }
    const id = playlist.playlist_id;
    if (pendingIds.has(id)) return;
    if (favoriteIds.has(id)) {
      const current = favorites.find((f) => f.playlist_id === id) ?? playlist;
      if (isLastFavorite(current, user)) setDialog({ type: 'last', playlist: current });
      else unfavorite(playlist);
      return;
    }
    if (favorites.length >= MAX_FAVORITES) setDialog({ type: 'replace', playlist });
    else favorite(playlist);
  }

  const close = () => setDialog(null);

  const value = {
    favorites,
    count: favorites.length,
    isLoading: Boolean(user) && favoritesQuery.isPending,
    isError: favoritesQuery.isError,
    retry: () => favoritesQuery.refetch(),
    isFavorite: (id) => favoriteIds.has(id),
    isPending: (id) => pendingIds.has(id),
    toggle,
  };

  return (
    <FavoritesContext value={value}>
      {children}
      <LoginPromptDialog open={dialog?.type === 'login'} onOpenChange={(open) => !open && close()} />
      {dialog?.type === 'replace' && (
        <ReplaceFavoriteDialog
          incoming={dialog.playlist}
          favorites={favorites}
          me={user}
          onCancel={close}
          onReplace={(old) => {
            close();
            favorite(dialog.playlist, old);
          }}
        />
      )}
      <ConfirmDialog
        open={dialog?.type === 'last'}
        onOpenChange={(open) => !open && close()}
        title={dialog?.type === 'last' ? `Remove ${dialog.playlist.name} from favorites?` : ''}
        confirmLabel="Remove"
        onConfirm={() => {
          const { playlist } = dialog;
          close();
          unfavorite(playlist);
        }}
      >
        {dialog?.type === 'last' && (
          <p>
            You&apos;re the only one who has it, so it becomes private and only{' '}
            {dialog.playlist.owner?.display_name ?? 'its owner'} will be able to open it.
          </p>
        )}
      </ConfirmDialog>
    </FavoritesContext>
  );
}
