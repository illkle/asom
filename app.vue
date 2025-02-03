<template>
  <div
    id="app"
    class="h-full min-h-screen w-full bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ShToaster :theme="colorMode.value === 'dark' ? 'dark' : 'light'" />
    <ErrorModal />

    <div id="customTeleport" class="absolute top-[-1000px]"></div>
  </div>
</template>

<script setup lang="ts">
import { debounce as _debounce } from 'lodash';
import { handleErrorsFromRust, useListenToEvent } from './api/tauriEvents';

const store = useStore();

onBeforeMount(async () => {
  await store.fetchRootPath();
});

const colorMode = useColorMode();

handleErrorsFromRust();

// Global hook for deleted files
useListenToEvent('FileRemove', (path) => {
  if (store.openedItem?.thing === path) {
    store.closeOpened();
  }

  nextTick(() => {
    const filtered = store.openedTabs.filter((v) => v.thing !== path);

    if (filtered.length !== store.openedTabs.length) {
      store.updateOpened(filtered);
    }
  });
});

useHead({
  htmlAttrs: {
    class: computed(() => {
      return [
        'overscroll-none overflow-hidden select-none',
        colorMode.value === 'dark'
          ? 'dark bg-gradient-to-t from-neutral-900 from-20% to-neutral-950 to-80%'
          : 'bg-gradient-to-t from-neutral-200 from-20% to-neutral-50 to-80%',
      ];
    }),
  },
  bodyAttrs: {
    class: 'min-h-screen text-neutral-950  dark:text-neutral-50',
  },
});
</script>

<style>
@reference '~/assets/css/main.css';

#app {
  --font: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter',
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Microsoft YaHei Light', sans-serif;

  font-family: var(--font);

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input {
  outline: none;
}

.editor {
  outline: none;
}

::-webkit-scrollbar {
  -webkit-appearance: none;
  @apply w-2;
}
::-webkit-scrollbar-thumb {
  @apply rounded-md bg-neutral-400 dark:bg-neutral-800;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-neutral-500 dark:bg-neutral-600;
}

::-webkit-scrollbar-track {
  @apply bg-neutral-50 dark:bg-neutral-950;
}

.dragApp {
  user-select: none;
  -webkit-app-region: drag;
  -webkit-user-select: none;
}
</style>
