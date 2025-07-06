import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Configuration simplifiée pour le développement client
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  root: './client', // Définir le répertoire racine comme client
  server: {
    port: 5000, // Utiliser le port 5000
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Proxy vers le serveur API sur un autre port
        changeOrigin: true,
      },
    },
  },
});
