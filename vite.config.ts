import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'sona-local-preview-health',
    configureServer(server) {
      server.middlewares.use('/__sona_health', (_request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify({ app: 'sona-store', pid: process.pid, instance: process.env.SONA_PREVIEW_INSTANCE ?? null }));
      });
    },
  }],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
});
