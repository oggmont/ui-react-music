import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { reloadForNewBuild } from './app/staleBuild';
import './styles/global.css';

// Vite reports a failed preload of a chunk's dependencies (JS or CSS) from an older build here.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild()) event.preventDefault();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
