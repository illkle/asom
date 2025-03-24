<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Sonner :theme="colorMode.value === 'dark' ? 'dark' : 'light'" />
  <ErrorModal />

  <div id="customTeleport" class="absolute top-[-1000px]"></div>
</template>

<script setup lang="ts">
import Sonner from '~/components/_shadcn/sonner/Sonner.vue';
import { useTabsStore } from './composables/stores/useTabsStore';
import { handleErrorsFromRust } from './composables/useRustErrorNotifcation';

const store = useTabsStore();

onMounted(() => {
  store.fetchOpened();
});

const colorMode = useColorMode();

handleErrorsFromRust();

// Global hook for deleted files
useListenToEvent('FileRemove', ({ c: path }) => {
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
        'select-none',
        colorMode.value === 'dark'
          ? 'dark bg-gradient-to-t from-neutral-900 from-20% to-neutral-950 to-80% text-neutral-50'
          : 'bg-gradient-to-t from-neutral-200 from-20% to-neutral-50 to-80% text-neutral-950',
      ];
    }),
  },
});
</script>

<style>
@reference '~/assets/css/main.css';
</style>
