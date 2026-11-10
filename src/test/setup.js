import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { clearSession } from '@/api/session';
import { server } from './server';

// Lazy routes load their module on first match; give findBy* time for that on slow machines.
configure({ asyncUtilTimeout: 10_000 });

// jsdom lacks a few browser APIs that Radix UI uses.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};

// Every request must be mocked: an unexpected call fails the test.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  clearSession();
  window.sessionStorage.clear();
});
afterAll(() => server.close());
