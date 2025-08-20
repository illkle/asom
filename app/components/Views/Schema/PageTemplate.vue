<template>
  <div
    ref="scrollElementRef"
    class="w-full overflow-y-auto overflow-x-hidden bg-background overscroll-none h-full scrollbarMod gutter-stable"
  >
    <div class="max-w-3xl mx-auto w-full px-4 pb-4">
      <div
        class="sticky top-0 z-10 empty:hidden pb-4 bg-gradient-to-b from-background to-transparent from-[calc(100%-8px)]"
      >
        <h1 v-if="$slots.title" class="text-3xl font-serif pt-2">
          <slot name="title" />
        </h1>
        <slot name="header" />
      </div>

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScrollRestorationOnMount, useScrollWatcher } from '~/composables/stores/useTabsStoreV2';

const props = defineProps({
  dataPending: {
    type: Boolean,
    default: false,
  },
});

const scrollElement = useTemplateRef('scrollElementRef');
useScrollWatcher(scrollElement);
useScrollRestorationOnMount(
  scrollElement,
  computed(() => !props.dataPending),
);
</script>
