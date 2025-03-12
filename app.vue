<template>
  <div
    id="app"
    class="h-full min-h-screen w-full bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Sonner :theme="colorMode.value === 'dark' ? 'dark' : 'light'" />
    <ErrorModal />

    <div id="customTeleport" class="absolute top-[-1000px]"></div>
  </div>
</template>

<script setup lang="ts">
import { debounce as _debounce } from 'lodash';
import { handleErrorsFromRust } from './composables/useRustErrorNotifcation';
import { useMainStore } from '~/composables/stores/useMainStore';
import Sonner from '~/components/_shadcn/sonner/Sonner.vue';

const store = useMainStore();

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
</style>
