/**
 * After a deploy, a tab that was opened on the previous build still asks for that build's code
 * chunks (`HomePage-<old hash>.js`), which the new server no longer has: the lazy route fails with
 * a 404. Reloading once fetches the new index.html and its chunks. The session survives the
 * reload (the refresh token is in sessionStorage).
 *
 * A flag in sessionStorage allows one reload per failure, so a chunk that is really missing shows
 * the error page instead of reloading forever. A successful load clears the flag.
 */
const FLAG = 'runlist.reloadedForNewBuild';

/** Where the app was going when the chunk failed; App.jsx points this at the router. */
let pendingTarget = () => null;
export function setReloadTarget(getTarget) {
  pendingTarget = getTarget;
}

/** Load the page being navigated to (a lazy route fails before the URL changes), else reload. */
function defaultReload() {
  const target = pendingTarget();
  if (target) window.location.assign(target);
  else window.location.reload();
}

function storage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reloads the page unless it was just reloaded for this; returns whether it did. */
export function reloadForNewBuild(reload = defaultReload) {
  const store = storage();
  if (!store || store.getItem(FLAG)) return false;
  store.setItem(FLAG, '1');
  reload();
  return true;
}

/** Wraps a dynamic import: on failure, reload once to pick up the new build. */
export async function importFresh(load, reload = defaultReload) {
  try {
    const module = await load();
    storage()?.removeItem(FLAG);
    return module;
  } catch (error) {
    // While the page reloads, never settle, so no error page flashes first.
    if (reloadForNewBuild(reload)) return new Promise(() => {});
    throw error;
  }
}
