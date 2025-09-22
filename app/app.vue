<template>
  <!-- Drag region, overlaid on top. Paddings are inside of layouts. -->
  <div
    data-tauri-drag-region
    class="fixed z-20 top-0 col-span-2 h-[0.5rem] w-full flex-shrink-0 opacity-0"
  ></div>

  <!-- App -->
  <NuxtLayout>
    <ErrorModal />
  </NuxtLayout>
  <Toaster :theme="colorMode.value === 'dark' ? 'dark' : 'light'" />

  <NuxtPage />
  <div id="customTeleport" class="absolute top-[-1000px]"></div>
</template>

<script setup lang="ts">
import 'vue-sonner/style.css';
import { Toaster } from '~/components/ui/sonner/';
import { useGlobalInvalidators } from '~/composables/data/queries';
import ErrorModal from './components/Modules/Error/ErrorModal.vue';
import { useGlobalTabHooks } from './composables/stores/useTabsStoreV2';

const colorMode = useColorMode();

const runtimeConfig = useRuntimeConfig();

const previewMode = runtimeConfig.public.previewMode;

useHead({
  htmlAttrs: {
    class: computed(() => {
      return ['overscroll-none', colorMode.value === 'dark' ? 'dark' : ''];
    }),
  },
});

if (!previewMode) {
  // App-wide logic
  useHandleErrorsFromRust();
  useGlobalInvalidators();
  useGlobalTabHooks();
}
</script>

<style></style>
