import { setupServer } from 'msw/node';

/** MSW server for unit tests. Each test adds the handlers it needs with `server.use(...)`. */
export const server = setupServer();

/** Absolute API URL in tests, e.g. `api('/me')`. */
export const api = (path) => `${window.location.origin}/api/v1${path}`;
