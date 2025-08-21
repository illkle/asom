<template>
  <div
    ref="scrollElementRef"
    class="w-full overflow-y-auto overflow-x-hidden bg-background overscroll-none h-full scrollbarMod gutter-stable px-4"
  >
    <div class="max-w-3xl mx-auto w-full pb-4 box-border pt-4">
      <div
        class="sticky -top-10 z-10 empty:hidden pb-4 bg-gradient-to-b from-background to-transparent from-[calc(100%-8px)]"
        :class="[$slots.header ? '-top-10' : '-top-13']"
      >
        <h1 v-if="$slots.title" class="text-3xl font-serif whitespace-nowrap h-11 pb-2">
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
