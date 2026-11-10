import { useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@/api/client';
import { addTracks, getPlaylist, removeTrackAt } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useToast } from '@/features/toast/context';
import { MAX_TRACKS } from '@/lib/limits';

/** The add menu's list of my playlists for one song (with `contains_track`). */
export const addMenuQueryKey = (trackId) =>
  queryKeys.myPlaylistsFor({ role: 'owner', sort: 'name', trackId });

/**
 * Add a song to one of my playlists (S4 § add menu). Optimistic: the count goes up and the toast
 * appears at once; if the request fails, the count goes back and the toast becomes the error.
 */
export function useAddToPlaylist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  function invalidate(playlistId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.myPlaylists });
    queryClient.invalidateQueries({ queryKey: queryKeys.me, exact: true });
    queryClient.invalidateQueries({ queryKey: queryKeys.playlist(playlistId) });
  }

  async function append(playlist, trackId) {
    try {
      return await addTracks(playlist.playlist_id, [trackId], playlist.version);
    } catch (error) {
      // Someone else changed the playlist: appending is safe to retry once with the new version.
      if (!isApiError(error, 412)) throw error;
      const fresh = await getPlaylist(playlist.playlist_id);
      return addTracks(playlist.playlist_id, [trackId], fresh.version);
    }
  }

  return async function addToPlaylist(playlist, track) {
    const key = addMenuQueryKey(track.track_id);
    const snapshot = queryClient.getQueryData(key);
    queryClient.setQueryData(key, (page) =>
      page
        ? {
            ...page,
            items: page.items.map((p) =>
              p.playlist_id === playlist.playlist_id
                ? {
                    ...p,
                    track_count: (p.track_count ?? 0) + 1,
                    contains_track: true,
                    last_added_at: new Date().toISOString(),
                  }
                : p,
            ),
          }
        : page,
    );

    const request = append(playlist, track.track_id);

    toast({
      message: `Added “${track.name}” to ${playlist.name}`,
      action: {
        label: 'Undo',
        onAction: async () => {
          try {
            const added = await request;
            await removeTrackAt(playlist.playlist_id, added.added[0].position, added.version);
            toast({ message: `Removed “${track.name}” from ${playlist.name}` });
          } catch {
            toast({ message: `Couldn't undo. Open ${playlist.name} to remove the song.`, variant: 'error' });
          } finally {
            invalidate(playlist.playlist_id);
          }
        },
      },
    });

    try {
      const added = await request;
      invalidate(playlist.playlist_id);
      return added;
    } catch (error) {
      queryClient.setQueryData(key, snapshot);
      if (isApiError(error, 422, 'playlist_full')) {
        toast({
          message: `${playlist.name} is full (${MAX_TRACKS} songs). Remove a song or pick another playlist.`,
          variant: 'error',
        });
      } else {
        toast({
          message: `Couldn't add “${track.name}” to ${playlist.name}. ${error.message}`,
          variant: 'error',
        });
      }
      invalidate(playlist.playlist_id);
      return null;
    }
  };
}
