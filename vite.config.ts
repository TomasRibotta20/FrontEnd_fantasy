import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()],
    server: {
      allowedHosts: ['ce43-2803-9800-98cf-1369-a8ed-a294-43bd-54d4.ngrok-free.app'],
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    test:{
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true
    },
})
