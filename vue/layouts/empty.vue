<template>
  <div class="h-screen overflow-y-scroll overscroll-none">
    <div
      data-tauri-drag-region
      class="z-100 sticky top-0 col-span-2 h-12 w-full flex-shrink-0 bg-neutral-50 dark:bg-neutral-950"
    ></div>

    <slot />
  </div>
</template>

<script lang="ts" setup></script>
