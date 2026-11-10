import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { ana, followedPage, tokens } from '@/test/fixtures';
import { preloadPages, renderApp } from '@/test/render';
import { api, server } from '@/test/server';

function homeHandlers() {
  return [
    http.get(api('/me'), () => HttpResponse.json(ana)),
    http.get(api('/me/following/playlists'), () => HttpResponse.json(followedPage([]))),
    http.get(api('/me/playlists'), () => HttpResponse.json({ items: [], limit: 100, offset: 0, total: 0 })),
    http.get(api('/tracks/random'), () => HttpResponse.json({ items: [] })),
    http.get(api('/playlists/random'), () => HttpResponse.json({ items: [] })),
  ];
}

describe('S1 Login', () => {
  beforeAll(preloadPages);

  it('sends signed-out people to Login', async () => {
    const { router } = renderApp('/songs');
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('checks for empty fields on submit', async () => {
    const { user } = renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(screen.getByText('Enter your username or email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Username or email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows one message for a wrong password or an unknown user', async () => {
    server.use(
      http.post(api('/auth/login'), () =>
        HttpResponse.json({ error: { code: 'invalid_credentials', message: 'Wrong.' } }, { status: 401 }),
      ),
    );
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Username or email'), 'ana.garcia');
    await user.type(screen.getByLabelText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "That username and password don't match. Check them and try again.",
    );
  });

  it('toggles the password visibility', async () => {
    const { user } = renderApp('/login');
    const password = await screen.findByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('logs in and goes to the page the person wanted', async () => {
    let body;
    server.use(
      http.post(api('/auth/login'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(tokens);
      }),
      ...homeHandlers(),
    );
    const { user, router } = renderApp('/');
    await user.type(await screen.findByLabelText('Username or email'), 'ana.garcia');
    await user.type(screen.getByLabelText('Password'), 'vinyl-sundays');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: /, Ana$/ })).toBeInTheDocument();
    expect(body).toEqual({ username: 'ana.garcia', password: 'vinyl-sundays' });
    expect(router.state.location.pathname).toBe('/');
  });
});
