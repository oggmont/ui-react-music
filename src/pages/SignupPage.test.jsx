import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { preloadPages, renderApp } from '@/test/render';
import { api, server } from '@/test/server';

const countries = [
  { code: 'MX', description: 'Mexico' },
  { code: 'ES', description: 'Spain' },
];

describe('S2 Sign up', () => {
  beforeAll(preloadPages);

  beforeEach(() => {
    server.use(http.get(api('/reference/countries'), () => HttpResponse.json(countries)));
  });

  it('suggests the username from the name until it is edited', async () => {
    const { user } = renderApp('/signup');
    await user.type(await screen.findByLabelText('Name'), 'Sofía López');
    const username = screen.getByLabelText('Username');
    expect(username).toHaveValue('sofia.lopez');
    await user.clear(username);
    await user.type(username, 'sofi');
    await user.type(screen.getByLabelText('Name'), 'a');
    expect(username).toHaveValue('sofi');
  });

  it('checks a field when it loses focus', async () => {
    const { user } = renderApp('/signup');
    await user.type(await screen.findByLabelText('Email'), 'nope');
    await user.tab();
    expect(screen.getByText('Enter an email address like name@example.com.')).toBeInTheDocument();
  });

  it('loads the countries for the dropdown', async () => {
    renderApp('/signup');
    expect(await screen.findByRole('option', { name: 'Spain' })).toBeInTheDocument();
  });

  it('puts "username taken" on its field', async () => {
    let body;
    server.use(
      http.post(api('/users'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { error: { code: 'username_taken', message: 'That username is already taken.' } },
          { status: 409 },
        );
      }),
    );
    const { user } = renderApp('/signup');
    await user.type(await screen.findByLabelText('Name'), 'Sofía López');
    await user.type(screen.getByLabelText('Email'), 'sofia.lopez@example.com');
    await user.type(screen.getByLabelText('Password'), 'vinyl-sundays');
    await user.selectOptions(screen.getByLabelText(/Country/), 'ES');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('That username is taken. Try sofia.lopez2.')).toBeInTheDocument();
    expect(body).toEqual({
      username: 'sofia.lopez',
      display_name: 'Sofía López',
      email: 'sofia.lopez@example.com',
      password: 'vinyl-sundays',
      country_code: 'ES',
    });
  });
});
