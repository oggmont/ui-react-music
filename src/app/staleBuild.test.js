import { importFresh, reloadForNewBuild } from './staleBuild';

describe('reloading once after a deploy', () => {
  afterEach(() => window.sessionStorage.clear());

  it('reloads when a chunk of the old build is gone, and stays pending meanwhile', async () => {
    const reload = vi.fn();
    const result = importFresh(
      () => Promise.reject(new TypeError('Failed to fetch dynamically imported module')),
      reload,
    );
    const settled = await Promise.race([
      result.then(
        () => 'settled',
        () => 'settled',
      ),
      new Promise((r) => setTimeout(() => r('pending'), 20)),
    ]);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(settled).toBe('pending');
  });

  it('shows the error instead of reloading again right after a reload', async () => {
    const reload = vi.fn();
    expect(reloadForNewBuild(reload)).toBe(true);
    const error = new TypeError('Failed to fetch dynamically imported module');
    await expect(importFresh(() => Promise.reject(error), reload)).rejects.toBe(error);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('allows a reload again once a chunk has loaded', async () => {
    const reload = vi.fn();
    reloadForNewBuild(reload);
    await expect(importFresh(() => Promise.resolve({ default: 'Page' }), reload)).resolves.toEqual({
      default: 'Page',
    });
    expect(reloadForNewBuild(reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
