<template>
  <div v-if="!isMac" class="h-full flex min-h-8">
    <button
      size="icon"
      class="flex w-12 items-center justify-center h-full rounded-none text-foreground hover:bg-muted-foreground/20"
      @click="appWindow.minimize()"
    >
      <MinusIcon class="w-3 h-3" />
    </button>
    <button
      size="icon"
      class="flex w-12 items-center justify-center h-full rounded-none text-foreground hover:bg-muted-foreground/20"
      @click="appWindow.toggleMaximize()"
    >
      <SquareIcon class="w-3 h-3" />
    </button>
    <button
      size="icon"
      id="titlebar-close"
      title="close"
      class="flex w-12 items-center justify-center h-full rounded-none hover:bg-red-500 hover:text-white text-foreground"
      @click="appWindow.close()"
    >
      <XIcon class="w-3.5 h-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MinusIcon, SquareIcon, XIcon } from 'lucide-vue-next';

const appWindow = getCurrentWindow();

const isMac = useIsMac();
</script>
