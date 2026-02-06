import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          ws: true,
        },
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            socket: ['socket.io-client'],
            ui: ['lucide-react', 'zustand', 'dexie']
          }
        }
      }
    },
    plugins: [react(), tailwindcss()],
    define: {
      'global': 'window',
      'process.env': '{}'
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
