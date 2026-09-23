import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const projectDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': path.resolve(projectDir, './src'),
    },
  },
  plugins: [
    ...(mode === 'development' ? [
      base44({
        legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
        hmrNotifier: true,
        navigationNotifier: true,
        analyticsTracker: true,
        visualEditAgent: true,
      }),
    ] : []),
    react(),
  ]
}));
