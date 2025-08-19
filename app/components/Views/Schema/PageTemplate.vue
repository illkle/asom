<template>
  <div
    ref="scrollElementRef"
    class="w-full overflow-auto bg-background overscroll-none h-full scrollbarMod gutter-stable px-4 py-5"
  >
    <div class="max-w-3xl mx-auto w-full">
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
