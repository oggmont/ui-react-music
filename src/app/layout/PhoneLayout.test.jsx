import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { ana, followedPage, playlist, track } from '@/test/fixtures';
import { preloadPages, renderApp } from '@/test/render';
import { api, server } from '@/test/server';

/*
 * The phone layout (UI-Design.md § Navigation, § Responsive behavior). jsdom applies no CSS, so
 * these tests check what the phone layout relies on: the tab bar and where it points, log out on
 * your own profile, the two-line song rows and the bottom-sheet class on menus. How it looks is
 * checked in a browser at phone width.
 */

const empty = { items: [], limit: 100, offset: 0, total: 0 };

function signedInHandlers({ randomTracks = [] } = {}) {
  server.use(
    http.get(api('/me'), () => HttpResponse.json(ana)),
    http.get(api('/me/following/playlists'), () => HttpResponse.json(followedPage([]))),
    http.get(api('/me/playlists'), () => HttpResponse.json(empty)),
    http.get(api('/tracks/random'), () => HttpResponse.json({ items: randomTracks })),
    http.get(api('/playlists/random'), () => HttpResponse.json({ items: [] })),
    http.get(api('/users/ana.garcia'), () => HttpResponse.json(ana)),
    http.get(api('/reference/countries'), () => HttpResponse.json([{ code: 'MX', description: 'Mexico' }])),
  );
}

const tabBar = () => screen.findByRole('navigation', { name: 'Tabs' });

describe('Phone layout', () => {
  beforeAll(preloadPages);

  it('has a tab bar with Home, Songs, Discover and Me, marking the current one', async () => {
    signedInHandlers();
    renderApp('/songs', { signedIn: true });
    const tabs = within(await tabBar());
    expect(tabs.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Home',
      'Songs',
      'Discover',
      'Me',
    ]);
    expect(tabs.getByRole('link', { name: 'Songs' })).toHaveAttribute('aria-current', 'page');
    expect(tabs.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(tabs.getByRole('link', { name: 'Me' })).toHaveAttribute('href', '/u/ana.garcia');
  });

  it('keeps "New playlist" as the name of the + button', async () => {
    signedInHandlers();
    renderApp('/', { signedIn: true });
    expect(await screen.findByRole('button', { name: 'New playlist' })).toBeInTheDocument();
  });

  it('opens your profile from Me, where you can log out', async () => {
    signedInHandlers();
    let loggedOut = false;
    server.use(
      http.post(api('/auth/logout'), () => {
        loggedOut = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user, router } = renderApp('/', { signedIn: true });
    await user.click(within(await tabBar()).getByRole('link', { name: 'Me' }));
    expect(await screen.findByRole('heading', { name: 'Ana García', level: 1 })).toBeInTheDocument();
    expect(within(await tabBar()).getByRole('link', { name: 'Me' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(loggedOut).toBe(true);
    expect(screen.queryByRole('navigation', { name: 'Tabs' })).not.toBeInTheDocument();
  });

  it("doesn't offer log out on someone else's profile", async () => {
    signedInHandlers();
    const ben = { ...ana, user_id: 3, username: 'ben.carter', display_name: 'Ben Carter' };
    server.use(
      http.get(api('/users/ben.carter'), () => HttpResponse.json(ben)),
      http.get(api('/users/ben.carter/favorites'), () => HttpResponse.json({ items: [] })),
    );
    renderApp('/u/ben.carter', { signedIn: true });
    expect(await screen.findByRole('heading', { name: 'Ben Carter', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
    expect(within(await tabBar()).getByRole('link', { name: 'Me' })).not.toHaveAttribute('aria-current');
  });

  it('shows no tab bar when signed out', async () => {
    renderApp('/login');
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Tabs' })).not.toBeInTheDocument();
  });

  it('puts artist · album on a second line of each song row, and opens Add as a sheet', async () => {
    signedInHandlers({ randomTracks: [track()] });
    server.use(
      http.get(api('/me/playlists'), () =>
        HttpResponse.json({ ...empty, items: [playlist({ track_count: 3 })], total: 1 }),
      ),
    );
    const { user } = renderApp('/songs', { signedIn: true });
    const row = (await screen.findByText('One More Time')).closest('[role="row"]');
    expect(within(row).getByText('Daft Punk · Discovery')).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: 'Add One More Time to a playlist' }));
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveClass('sheet-on-phone');
    expect(await within(menu).findByRole('menuitem', { name: /Road Trip/ })).toBeInTheDocument();
  });
});
