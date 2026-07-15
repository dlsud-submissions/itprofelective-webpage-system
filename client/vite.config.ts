import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies the auth API to the golden-fur-mongo Express backend
// (see ../server.js) so the browser sees everything as same-origin --
// this is what lets the httpOnly session cookie set by POST /login be
// readable on subsequent requests without any CORS configuration.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/register': { target: 'http://localhost:4000', changeOrigin: true },
      '/login': { target: 'http://localhost:4000', changeOrigin: true },
      '/logout': { target: 'http://localhost:4000', changeOrigin: true },
      '/me': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
