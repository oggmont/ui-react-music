/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Variables without the VITE_ prefix stay on the dev server and never reach the bundle.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:8081';
  const usePolling = env.WATCH_POLLING === 'true';
  // Hosts besides localhost that may open the dev server, e.g. the container name for
  // end-to-end tests (Selenium/Cypress) running on the same Docker network.
  const allowedHosts = ['music-ui', ...(env.ALLOWED_HOSTS ?? '').split(',')]
    .map((h) => h.trim())
    .filter(Boolean);

  // The browser talks same-origin to this proxy, so CORS doesn't apply. Drop the Origin header so
  // the API's CORS filter doesn't reject origins it doesn't list (e.g. http://music-ui:5173).
  // Safe: the API authenticates with bearer tokens, not cookies.
  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
    configure: (proxy) => proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin')),
  };

  return {
    plugins: [
      react(),
      // React Compiler (stable, v1): automatic memoization, so components don't need useMemo/useCallback.
      babel({ presets: [reactCompilerPreset()] }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      strictPort: true,
      allowedHosts,
      // The browser calls /api on this origin and Vite forwards it to the Spring API, so no CORS is needed.
      proxy: { '/api': apiProxy },
      watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
    },
    preview: {
      port: 4173,
      proxy: { '/api': apiProxy },
    },
    build: {
      sourcemap: true,
      rolldownOptions: {
        output: {
          // Libraries change less often than app code: separate chunks keep them cached across deploys.
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
                priority: 2,
              },
              { name: 'vendor', test: /node_modules[\\/]/, priority: 1 },
            ],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      // Page tests render the real routes, which load lazily; leave room for slow or busy machines.
      testTimeout: 15_000,
      hookTimeout: 60_000,
      include: ['src/**/*.test.{js,jsx}'],
      coverage: {
        provider: 'v8',
        include: ['src'],
        exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
        reporter: ['text', 'html'],
      },
    },
  };
});
