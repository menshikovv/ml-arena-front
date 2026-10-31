import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const projectDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(async ({ mode, command }) => {
  const screenshots = command === 'serve' && mode === 'screenshots';
  return {
  ...(screenshots ? {
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('') },
    server: { host: '127.0.0.1' },
  } : {}),
  resolve: {
    alias: {
      '@': path.resolve(projectDir, './src'),
    },
  },
  plugins: [
    ...(screenshots ? [(await import('./scripts/screenshot-demo.mjs')).screenshotDemoPlugin()] : []),
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
  };
});
