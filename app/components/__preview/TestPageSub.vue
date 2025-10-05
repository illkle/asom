<template>
  <div ref="scrollElementRef">
    {{ fl.files.data.value }}
  </div>
</template>

<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual';
import { useFilesListV2 } from '~/components/Views/List/useFileList';

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
});

const fl = useFilesListV2({
  opened: {
    _type: 'folder',
    _path: props.path,
    scrollPositionY: 0,
    scrollPositionX: 0,
    details: {},
  },
});

const scrollElementRef = useTemplateRef('scrollElementRef');

const rowVirtualizerOptions = computed(() => {
  return {
    count: fl.files.data.value?.records.length ?? 0,
    estimateSize: () => 37,
    getScrollElement: () => scrollElementRef.value as HTMLDivElement,
    overscan: 10,
  };
});
useVirtualizer(rowVirtualizerOptions);
</script>
