export default defineNuxtConfig({
  devtools: { enabled: true },
  alias: {
    components: '/<srcDir>/components',
  },

  modules: ['nuxt-electron', '@nuxtjs/tailwindcss', '@pinia/nuxt'],

  electron: {
    build: [
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          args.reload();
        },
      },
    ],
    // Ployfill the Electron and Node.js API for Renderer process.
    // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
    // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
    renderer: {},
  },
  nitro: {
    runtimeConfig: {
      app: {
        baseURL: './',
      },
    },
  },
  ssr: false, // #43
});
