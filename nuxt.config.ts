import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

export default defineNuxtConfig({
  components: {
    dirs: [],
  },

  alias: {
    '~c': fileURLToPath(new URL('app/components', import.meta.url)),
    types: fileURLToPath(new URL('app/types', import.meta.url)),
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@pinia/colada-nuxt',
    'motion-v/nuxt',
    '@nuxt/test-utils/module',
  ],

  compatibilityDate: '2024-09-29',

  experimental: { watcher: 'parcel' },

  shadcn: {
    prefix: '',
    componentDir: '~/components/ui',
  },

  css: ['~/assets/css/tailwind.css', '~/assets/css/app.css'],

  $env: {
    preview: {
      runtimeConfig: {
        public: {
          previewMode: true,
        },
      },
    },
  },

  // Everything below is recomended Tauri config for nuxt
  // https://v2.tauri.app/start/frontend/nuxt/
  devtools: { enabled: false },
  ssr: false,
  devServer: { host: '0.0.0.0' },
  vite: {
    plugins: [tailwindcss()],
    clearScreen: false,
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      strictPort: true,
      hmr: {
        // Use websocket for mobile hot reloading
        protocol: 'ws',
        // Make sure it's available on the network
        host: '0.0.0.0',
        port: 5183,
      },
    },
  },
});
