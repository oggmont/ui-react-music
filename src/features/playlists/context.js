import { createContext, use } from 'react';

export const CreatePlaylistContext = createContext(null);

/** `openCreatePlaylist({ track? })` opens S5 from anywhere (header, add menu, empty states). */
export function useCreatePlaylist() {
  const value = use(CreatePlaylistContext);
  if (!value) throw new Error('useCreatePlaylist must be used inside <CreatePlaylistProvider>');
  return value;
}
