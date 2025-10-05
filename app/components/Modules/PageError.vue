<template>
  <div class="flex flex-col items-center justify-center h-full gap-4 bg-background">
    <h2 class="text-2xl font-bold">Something went wrong :(</h2>

    <p v-if="message" class="text-sm text-muted-foreground">
      {{ message }}
    </p>

    <p class="text-sm text-muted-foreground">
      If you believe this is a bug, please create an issue on
      <a
        href="https://github.com/illkle/asom/issues"
        @click.prevent="openUrl('https://github.com/illkle/asom/issues')"
        class="underline"
        >GitHub.</a
      >
    </p>
  </div>
</template>
<
<script setup lang="ts">
import { openUrl } from '@tauri-apps/plugin-opener';

const props = defineProps({
  message: {
    type: String,
  },
});
</script>
