<template>
  <div class="h-full w-full bg-background min-h-screen">
    <div class="flex flex-col gap-2 mx-auto px-4 w-full h-full py-10 max-w-5xl">
      <h1>Area for testing components.</h1>
      <div class="text-sm">Can be launched without tauri via <code>npm run dev:preview</code>.</div>

      <PreviewPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import PreviewPage from '~/components/__preview/PreviewPage.vue';
</script>
