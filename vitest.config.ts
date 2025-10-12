import { defineVitestProject } from '@nuxt/test-utils/config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['**/*.{test,spec}.ts'],
          exclude: ['e2e/**/*', 'node_modules/**/*'],
          environment: 'nuxt',
        },
      }),
    ],
  },
});
