import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add Node.js polyfills to handle externalized modules gracefully
    nodePolyfills({
      // Whether to polyfill `global`.
      globals: {
        Buffer: true, // can also be 'build' or 'dev'
        global: true,
        process: true,
      },
      // Whether to polyfill specific globals.
      exclude: ['fs'],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/i18n': path.resolve(__dirname, './src/i18n'),
    },
    // Add externalization for Node.js modules to reduce warnings
    // These modules don't exist in browser and should be externalized
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      external: [
        // Externalize Node.js modules to avoid browser compatibility warnings
        'fs',
        'path',
        'crypto',
        'os',
        'util',
        'stream',
        'perf_hooks',
        'vm',
        'assert',
        'url',
        'tty',
        'module',
        'process',
        'v8',
      ],
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
