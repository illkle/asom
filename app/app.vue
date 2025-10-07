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
  <Toaster :theme="colorMode.value === 'dark' ? 'dark' : 'light'" class="pointer-events-auto" />

  <NuxtPage />
  <div id="customTeleport" class="absolute top-[-1000px]"></div>

  <input v-if="E2E" id="rootPathE2E" type="text" class="absolute bottom-0 right-0" />
</template>

<script setup lang="ts">
import 'vue-sonner/style.css';
import { useHandleErrorsFromRust } from '~/components/Core/Errors/errors';
import { Toaster } from '~/components/ui/sonner/';
import { useGlobalInvalidators } from '~/composables/data/queries';
import ErrorModal from './components/Core/Errors/ErrorModal.vue';
import { useGlobalTabHooks } from './composables/stores/useTabsStoreV2';

const E2E = import.meta.env['TAURI_E2E_TESTING'];
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

provide('PREVIEW_MODE', previewMode);
</script>

<style></style>
