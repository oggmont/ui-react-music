import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { ana, ben, diego, followedPage, playlist, ref } from '@/test/fixtures';
import { preloadPages, renderApp } from '@/test/render';
import { api, server } from '@/test/server';

const nightDrive = playlist({ playlist_id: 30, name: 'Night Drive', owner: ref(ben), follower_count: 2 });

function useDiscover(favorites) {
  server.use(
    http.get(api('/me'), () => HttpResponse.json({ ...ana, favorite_count: favorites.length })),
    http.get(api('/me/following/playlists'), () => HttpResponse.json(followedPage(favorites))),
    http.get(api('/playlists/random'), () => HttpResponse.json({ items: [nightDrive] })),
  );
}

describe('S6 Discover and the favorite heart', () => {
  beforeAll(preloadPages);

  it('favorites a playlist and says so', async () => {
    useDiscover([]);
    let favorited = false;
    server.use(
      http.put(api('/me/following/playlists/30'), () => {
        favorited = true;
        return HttpResponse.json({
          playlist_id: 30,
          is_favorite: true,
          visibility: 'public',
          follower_count: 3,
          my_favorite_count: 1,
        });
      }),
    );
    const { user } = renderApp('/discover', { signedIn: true });
    expect(await screen.findByText(/Your favorites:/)).toHaveTextContent('0 of 5');
    const heart = await screen.findByRole('button', { name: 'Favorite Night Drive' });
    expect(heart).toHaveAttribute('aria-pressed', 'false');
    await user.click(heart);
    expect(await screen.findByText('Added Night Drive to favorites · 1 of 5')).toBeInTheDocument();
    expect(favorited).toBe(true);
  });

  it('opens Replace a favorite at 5 of 5, saying what happens to each one', async () => {
    const five = [
      playlist({ playlist_id: 20, name: 'Road Trip', follower_count: 3 }),
      playlist({ playlist_id: 25, name: 'Sunday Morning', follower_count: 1 }),
      playlist({ playlist_id: 22, name: 'Boleros para mamá', owner: ref(diego), follower_count: 1 }),
      playlist({ playlist_id: 31, name: 'Coding Focus', owner: ref(ben), follower_count: 2 }),
      playlist({ playlist_id: 32, name: 'Mexican 80s', owner: ref(diego), follower_count: 2 }),
    ];
    useDiscover(five);
    let replaces;
    server.use(
      http.put(api('/me/following/playlists/30'), async ({ request }) => {
        replaces = (await request.json()).replaces;
        return HttpResponse.json({
          playlist_id: 30,
          is_favorite: true,
          visibility: 'public',
          follower_count: 3,
          my_favorite_count: 5,
          replaced: { playlist_id: 25, visibility: 'private', follower_count: 0 },
        });
      }),
    );
    const { user } = renderApp('/discover', { signedIn: true });
    await user.click(await screen.findByRole('button', { name: 'Favorite Night Drive' }));

    const dialog = await screen.findByRole('dialog', { name: 'Your favorites are full' });
    const rows = within(dialog).getAllByRole('radio');
    expect(rows).toHaveLength(5);
    expect(within(dialog).getByText(/by you · stays public · 2 others have it/)).toBeInTheDocument();
    expect(within(dialog).getByText(/by you · becomes private/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/by Diego Ramos · becomes private · you can't open it again/),
    ).toBeInTheDocument();

    const replace = within(dialog).getByRole('button', { name: 'Replace' });
    expect(replace).toBeDisabled();
    await user.click(within(dialog).getByLabelText(/Sunday Morning/));
    await user.click(replace);

    expect(
      await screen.findByText('Replaced Sunday Morning with Night Drive · Sunday Morning is now private'),
    ).toBeInTheDocument();
    expect(replaces).toBe(25);
  });
});
