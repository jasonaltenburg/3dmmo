import { defineConfig } from 'vite';

export default defineConfig({
  // ---> Add this line <---
  base: '/3dmmo/', 

  server: {
    host: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000', // Or 3001 if you left it there
        ws: true,
        changeOrigin: true,
      },
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
