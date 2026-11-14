import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import { getMyPlaylists } from '@/api/endpoints';
import { Cover } from '@/components/Cover';
import { Skeleton } from '@/components/Skeleton';
import { buildAddMenu, filterByName } from '@/lib/rules';
import { useCreatePlaylist } from './context';
import styles from './AddToPlaylistMenu.module.css';
import { addMenuQueryKey, useAddToPlaylist } from './useAddToPlaylist';

const FILTER_FROM = 8;

function MenuItem({ item, onPick }) {
  const { playlist, full, added, disabled, status } = item;
  return (
    <DropdownMenu.Item className={styles.item} disabled={disabled} onSelect={() => onPick(playlist)}>
      <Cover playlist={playlist} className={styles.cover} />
      <span className={styles.name}>{playlist.name}</span>
      <span className={`${styles.status} ${full ? styles.full : ''} ${added ? styles.added : ''} num`}>
        {status}
      </span>
    </DropdownMenu.Item>
  );
}

function MenuBody({ track, onPick, onNew }) {
  const [filter, setFilter] = useState('');
  const filterRef = useRef(null);
  const query = useQuery({
    queryKey: addMenuQueryKey(track.track_id),
    queryFn: ({ signal }) =>
      getMyPlaylists({ role: 'owner', sort: 'name', containsTrack: track.track_id }, signal),
  });
  const { lastUsed, items } = buildAddMenu(query.data?.items);
  const showFilter = items.length >= FILTER_FROM;

  // With 8 or more playlists, the filter field has focus when the menu opens.
  useEffect(() => {
    if (!showFilter) return undefined;
    const frame = requestAnimationFrame(() => filterRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showFilter]);

  function handleFilterKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.currentTarget
        .closest('[role="menu"]')
        ?.querySelector('[role="menuitem"]:not([data-disabled])')
        ?.focus();
    } else if (event.key !== 'Escape' && event.key !== 'Tab') {
      // Keep the menu's typeahead from taking the keys typed in the field.
      event.stopPropagation();
    }
  }

  let body;
  if (query.isPending) {
    body = (
      <div className={styles.loading} role="status">
        <span className="visually-hidden">Loading your playlists…</span>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={32} />
        ))}
      </div>
    );
  } else if (query.isError) {
    body = (
      <div className={styles.none}>
        Couldn&apos;t load your playlists.{' '}
        <button type="button" className={styles.retry} onClick={() => query.refetch()}>
          Try again
        </button>
      </div>
    );
  } else if (items.length === 0) {
    body = <div className={styles.none}>You don&apos;t have a playlist yet.</div>;
  } else {
    const visible = filterByName(items, filter);
    body = (
      <>
        {showFilter && (
          <div className={styles.filter}>
            <input
              ref={filterRef}
              className={styles.filterInput}
              placeholder="Filter playlists"
              aria-label="Filter playlists"
              autoComplete="off"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={handleFilterKeyDown}
            />
          </div>
        )}
        {lastUsed && !filter && (
          <DropdownMenu.Group>
            <DropdownMenu.Label className={`${styles.group} lbl-caps`}>Last used</DropdownMenu.Label>
            <MenuItem item={lastUsed} onPick={onPick} />
          </DropdownMenu.Group>
        )}
        <DropdownMenu.Group>
          <DropdownMenu.Label className={`${styles.group} lbl-caps`}>All playlists (A–Z)</DropdownMenu.Label>
          {visible.map((item) => (
            <MenuItem key={item.playlist.playlist_id} item={item} onPick={onPick} />
          ))}
          {visible.length === 0 && <div className={styles.none}>No playlists match “{filter}”.</div>}
        </DropdownMenu.Group>
      </>
    );
  }

  return (
    <>
      {body}
      <DropdownMenu.Separator className={styles.separator} />
      <DropdownMenu.Item className={`${styles.item} ${styles.plain}`} onSelect={onNew}>
        <Plus size={20} aria-hidden="true" />
        <span className={styles.name}>New playlist</span>
      </DropdownMenu.Item>
    </>
  );
}

/**
 * "+ Add" on a song row (UI-Design.md § Add to playlist): a menu button, not a <select>. Last used
 * first, then every playlist A–Z, then "+ New playlist". Enter/Space opens, arrows move, Esc closes.
 * On a phone the button is just "+" and the menu opens as a bottom sheet (`sheet-on-phone`).
 */
export function AddToPlaylistMenu({ track, onAdded }) {
  const [open, setOpen] = useState(false);
  const addToPlaylist = useAddToPlaylist();
  const { open: openCreate } = useCreatePlaylist();

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button type="button" className={styles.trigger} aria-label={`Add ${track.name} to a playlist`}>
          <Plus size={18} aria-hidden="true" />
          <span className={styles.triggerLabel}>Add</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={`${styles.menu} sheet-on-phone`}
          align="end"
          sideOffset={6}
          collisionPadding={12}
          loop
        >
          <DropdownMenu.Label className={styles.title}>Add “{track.name}” to</DropdownMenu.Label>
          {open && (
            <MenuBody
              track={track}
              onPick={(playlist) => {
                onAdded?.();
                addToPlaylist(playlist, track);
              }}
              onNew={() => openCreate({ track })}
            />
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
