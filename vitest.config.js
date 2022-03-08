/**
 * Config for global end-to-end tests
 * placed in project root tests folder
 * @type {import('vite').UserConfig}
 * @see https://vitest.dev/config/
 */
const config = {
  test: {
    include: ['./tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // A default timeout of 5000ms is sometimes not enough for playwright.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
};

export default config;