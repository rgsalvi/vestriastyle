import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Group heavy vendor libraries into dedicated chunks
          if (id.includes('react')) return 'vendor-react';
          if (id.includes('react-router')) return 'vendor-react';
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('@tensorflow') || id.includes('tfjs')) return 'vendor-tf';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('@google/genai')) return 'vendor-genai';
          if (id.includes('twilio')) return 'vendor-twilio';
          if (id.includes('jwt-decode')) return 'vendor-misc';
          return 'vendor';
        },
      },
      input: {
        main: resolve(__dirname, 'index.html'),
        stylist: resolve(__dirname, 'stylist.html'),
      },
    },
  },
})