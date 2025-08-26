import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './client',
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './client/src'),
      '@shared': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './shared'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
