import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: {
  cwd(): string;
};

// Dev server proxies the auth API to the golden-fur-mongo Express backend
// (see ../server/src/server.ts) so the browser sees everything as same-origin --
// this is what lets the httpOnly session cookie set by POST /login be
// readable on subsequent requests without any CORS configuration.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:4321';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/register': { target: backendTarget, changeOrigin: true },
        '/login': { target: backendTarget, changeOrigin: true },
        '/logout': { target: backendTarget, changeOrigin: true },
        '/me': { target: backendTarget, changeOrigin: true },
        '/services': { target: backendTarget, changeOrigin: true },
        '/products': { target: backendTarget, changeOrigin: true },
      },
    },
  };
});
