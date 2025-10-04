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
        <div class="flex items-baseline gap-2 not-last:pb-2">
          <h1 v-if="$slots.title" class="text-3xl font-serif whitespace-nowrap">
            <slot name="title" />
          </h1>
          <slot name="title-badge" />
        </div>
        <slot name="header" />
      </div>

      <div v-if="!dataPending">
        <slot />
      </div>
      <div v-else class="flex items-center justify-center py-32">
        <LoaderAnimated class="text-muted-foreground opacity-70" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoaderAnimated from '~/components/Modules/LoaderAnimated.vue';
import {
  useScrollRestorationOnMount,
  useScrollWatcher,
  useUpdateCurrentTabTitleFrom,
} from '~/composables/stores/useTabsStoreV2';

const props = defineProps({
  dataPending: {
    type: Boolean,
    default: false,
  },
  tabTitle: {
    type: String,
    required: true,
  },
});

const scrollElement = useTemplateRef('scrollElementRef');
useScrollWatcher(scrollElement);
useScrollRestorationOnMount(
  scrollElement,
  computed(() => !props.dataPending),
);

useUpdateCurrentTabTitleFrom({ target: computed(() => props.tabTitle) });
</script>
