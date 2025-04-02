<template>
  <!-- Drag region, overlaid on top. Paddings are inside of layouts. -->
  <div
    data-tauri-drag-region
    class="fixed z-20 top-0 col-span-2 h-[2rem] w-full flex-shrink-0 bg-red-500 opacity-0"
  ></div>

  <!-- App -->
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Sonner :theme="colorMode.value === 'dark' ? 'dark' : 'light'" />
  <ErrorModal />

  <div id="customTeleport" class="absolute top-[-1000px]"></div>
</template>

<script setup lang="ts">
import { useGlobalTabHooks } from './composables/stores/useTabsStore';

const colorMode = useColorMode();

useHead({
  htmlAttrs: {
    class: computed(() => {
      return ['overscroll-none', colorMode.value === 'dark' ? 'dark' : ''];
    }),
  },
});

// App-wide logic
useHandleErrorsFromRust();
useGlobalInvalidators();
useGlobalTabHooks();
</script>

<style></style>
