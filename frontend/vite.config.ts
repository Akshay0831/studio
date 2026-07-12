import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and core libraries
          'react-vendor': ['react', 'react-dom', 'react-hot-toast'],
          // Split third-party UI libraries
          'ui-vendor': ['lucide-react', 'yjs', 'y-websocket', 'tone'],
          // Split third-party CSS and utilities
          'css-vendor': ['fabric', 'tailwindcss'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
