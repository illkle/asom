<template>
  <div class="flex flex-col gap-2 mx-auto px-4 w-full py-10 max-w-5xl">
    <NestedDragTestComponent />
  </div>
</template>

<script setup lang="ts">
import type { IDynamicViewGroup, ILayoutItem } from '~/components/DynamicView/helpers';

definePageMeta({
  layout: 'empty',
});

const layout = ref<IDynamicViewGroup>({
  id: 'root',
  type: 'group',
  style: { direction: 'row', gap: '0', align: 'start', justify: 'start' },
  content: [
    {
      id: 'lol',
      type: 'group',
      style: { direction: 'row', gap: '16', align: 'start', justify: 'start' },
      content: [{ type: 'item', id: '133' }],
    },
  ],
});

const availableItems = ref<ILayoutItem[]>([{ id: '133', type: 'item' }]);
const dataRefs = {
  layout,
  availableItems,
};
</script>

<style scoped>
.dense {
  grid-auto-flow: dense;
}
</style>
