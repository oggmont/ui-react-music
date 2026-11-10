import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createPlaylist } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/features/auth/context';
import { useToast } from '@/features/toast/context';
import { MAX_PLAYLISTS } from '@/lib/limits';
import { CreatePlaylistContext } from './context';
import { playlistFormFailure } from './errors';
import { PlaylistFormDialog } from './PlaylistFormDialog';

export function CreatePlaylistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [request, setRequest] = useState(null);

  const ownedCount = user?.owned_playlist_count ?? 0;
  const atLimit = ownedCount >= MAX_PLAYLISTS;

  function open({ track } = {}) {
    if (atLimit) {
      toast({
        message: 'You have 20 playlists, the most allowed. Delete one to make a new one.',
        variant: 'error',
      });
      return;
    }
    setRequest({ id: Date.now(), track });
  }

  async function submit({ name, description }) {
    const track = request.track;
    try {
      const created = await createPlaylist({
        name,
        description,
        trackIds: track ? [track.track_id] : undefined,
      });
      setRequest(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.me, exact: true });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPlaylists });
      if (track) {
        // Created from the add menu: the song is in it, and you stay where you were.
        toast({ message: `Created ${created.name} and added “${track.name}”` });
      } else {
        toast({ message: `Created ${created.name}` });
        navigate(`/playlists/${created.playlist_id}`);
      }
    } catch (error) {
      throw playlistFormFailure(error);
    }
  }

  const value = { open, atLimit, ownedCount };

  return (
    <CreatePlaylistContext value={value}>
      {children}
      {request && (
        <PlaylistFormDialog
          key={request.id}
          mode="create"
          ownedCount={ownedCount}
          track={request.track}
          onSubmit={submit}
          onClose={() => setRequest(null)}
        />
      )}
    </CreatePlaylistContext>
  );
}
