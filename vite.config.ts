import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm(), react()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stylist: resolve(__dirname, 'stylist.html'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['@tensorflow-models/face-detection', '@tensorflow/tfjs'],
  },
  worker: {
    format: 'es',
  },
})