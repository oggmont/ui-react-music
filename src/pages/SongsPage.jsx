import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Search, Shuffle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getRandomTracks, searchTracks } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { Screen } from '@/app/layout/Layouts';
import { Button, IconButton } from '@/components/Button';
import { SongList, SongListSkeleton } from '@/components/SongList';
import { EmptyState, ErrorState } from '@/components/States';
import { AddToPlaylistMenu } from '@/features/playlists/AddToPlaylistMenu';
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/lib/limits';
import styles from './Pages.module.css';

const MAX_EXCLUDE = 1000;
const toRows = (pages) =>
  pages
    .flatMap((page) => page.items)
    .map((track, i) => ({ key: `${track.track_id}-${i}`, number: i + 1, track }));
const renderAdd = ({ track }) => <AddToPlaylistMenu track={track} />;

function RandomSongs({ seed }) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.randomTracks(PAGE_SIZE, seed),
    queryFn: ({ pageParam, signal }) => getRandomTracks({ limit: PAGE_SIZE, exclude: pageParam }, signal),
    initialPageParam: [],
    // "Load more" leaves out the songs already on screen.
    getNextPageParam: (last, pages) => {
      const shown = pages.flatMap((page) => page.items.map((t) => t.track_id));
      return last.items.length && shown.length < MAX_EXCLUDE ? shown : undefined;
    },
    staleTime: Infinity,
  });

  if (query.isPending) return <SongListSkeleton count={10} />;
  if (query.isError) return <ErrorState message="Couldn't load songs." onRetry={query.refetch} />;
  return (
    <>
      <SongList label="Random songs" rows={toRows(query.data.pages)} renderAction={renderAdd} />
      {query.hasNextPage && (
        <div className={styles.center}>
          <Button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? 'Loading…' : `Load ${PAGE_SIZE} more`}
          </Button>
        </div>
      )}
    </>
  );
}

function SearchResults({ q, onClear }) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.searchTracks(q),
    queryFn: ({ pageParam, signal }) => searchTracks({ q, limit: PAGE_SIZE, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length;
      return next < last.total ? next : undefined;
    },
    // While a new search runs, the previous results stay on screen, dimmed.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  if (query.isPending) return <SongListSkeleton count={8} />;
  if (query.isError && !query.isPlaceholderData)
    return <ErrorState message="Search isn't working right now." onRetry={query.refetch} />;

  const total = query.data.pages[0]?.total ?? 0;
  const shownQuery = query.data.pages[0]?.query ?? q;
  if (total === 0 && !query.isPlaceholderData) {
    return (
      <EmptyState
        role="status"
        title={`No songs match “${q}”`}
        action={
          <Button size="sm" onClick={onClear}>
            Clear search
          </Button>
        }
      >
        Check the spelling, or try an artist or album name.
      </EmptyState>
    );
  }

  return (
    <>
      <p className="muted" role="status">
        <b className={styles.strong}>{total === 1 ? '1 song matches' : `${total} songs match`}</b> “
        {shownQuery}”
      </p>
      <SongList
        label="Search results"
        rows={toRows(query.data.pages)}
        renderAction={renderAdd}
        dimmed={query.isPlaceholderData}
      />
      {query.hasNextPage && !query.isPlaceholderData && (
        <div className={styles.center}>
          <Button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? 'Loading…' : 'Load more results'}
          </Button>
        </div>
      )}
    </>
  );
}

/**
 * S4 Songs: search (D-08) or browse a random selection, and add songs to playlists quickly.
 * The query lives in the URL (`/songs?q=daft+punk`) so Back and bookmarks work.
 */
export default function SongsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const searching = q.length >= SEARCH_MIN_CHARS;
  const [text, setText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const [seed, setSeed] = useState(0);
  const timer = useRef(null);
  const inputRef = useRef(null);

  // The URL changed from outside (Back, a bookmark): show its query in the box.
  if (q !== syncedQ) {
    setSyncedQ(q);
    if (text.trim() !== q) setText(q);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function commit(value) {
    clearTimeout(timer.current);
    const next = value.trim();
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next.length >= SEARCH_MIN_CHARS) params.set('q', next);
        else params.delete('q');
        return params;
      },
      // Starting a search adds a history entry; refining it replaces that entry.
      { replace: searchParams.has('q') },
    );
  }

  function handleChange(event) {
    const value = event.target.value;
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(value), SEARCH_DEBOUNCE_MS);
  }

  function clear() {
    setText('');
    commit('');
    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit(text);
    } else if (event.key === 'Escape' && text) {
      event.preventDefault();
      clear();
    }
  }

  function shuffle() {
    setText('');
    commit('');
    setSeed((s) => s + 1);
  }

  return (
    <Screen>
      <div className={styles.pageHead}>
        <div>
          <h1 className="disp">Songs</h1>
          <p className="muted">A random handful from the catalog. Search, or shuffle for more.</p>
        </div>
      </div>
      <div className={styles.searchBar} role="search">
        <span className={styles.search}>
          <Search className={styles.searchIcon} size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className={styles.searchInput}
            placeholder="Search songs, artists or albums"
            aria-label="Search songs"
            autoComplete="off"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          {text && <IconButton className={styles.clear} icon={X} label="Clear search" onClick={clear} />}
        </span>
        <Button icon={Shuffle} onClick={shuffle}>
          Shuffle
        </Button>
      </div>
      <div className={styles.results}>
        {searching ? <SearchResults q={q} onClear={clear} /> : <RandomSongs seed={seed} />}
      </div>
    </Screen>
  );
}
