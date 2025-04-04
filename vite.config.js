import { defineConfig } from 'vite';

export default defineConfig({
  // root is project root (default)

  server: {
    host: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // NO rollupOptions here
  },

  // Keep publicDir so assets in /public are served
});
