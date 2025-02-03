import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  alias: {
    components: './components',
    '@types': './types',
  },
  modules: ['@pinia/nuxt', '@nuxtjs/color-mode', '@pinia/colada-nuxt'],

  compatibilityDate: '2024-09-29',

  shadcn: {
    prefix: 'Sh',
    componentDir: './components/_shadcn',
  },
  css: ['~/assets/css/main.css'],

  // Everything below is recomended Tauri config for nuxt
  // https://v2.tauri.app/start/frontend/nuxt/
  devtools: { enabled: true },
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
