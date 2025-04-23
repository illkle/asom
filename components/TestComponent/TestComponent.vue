<template>
  <div class="flex gap-2">
    <TestGroup
      :item="groups"
      :level="0"
      class="p-2 data-[dragging=true]:border-accent-foreground border data-[can-drop=true]:bg-red-500"
    >
    </TestGroup>
  </div>

  {{ groups }}

  <div>
    {{ hoveredItem }}
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useProvideDNDContext } from './common';
import {
  findAndRemoveItem,
  insertItemIntoGroup,
  sampleData,
  type ContentGroup,
  type Item,
} from './dataShape';
import TestGroup from './TestGroup.vue';

const commonType = 'test';

const groups = ref<ContentGroup>(sampleData);

const getAllSubItems = (data: Item) => {
  const res: Item[] = [data];

  if (data.type !== 'group') {
    return [];
  }

  for (const item of data.content) {
    res.push(item);
    if (item.type === 'group') {
      res.push(...getAllSubItems(item));
    }
  }

  return res;
};

const { virtual, offset, starterPosition, draggedItem, hoveredItem } = useProvideDNDContext({
  itemsRef: groups,
  removeItemInPlace: (data, item) => {
    const i = findAndRemoveItem(data, item.id);
    if (!i) {
      throw new Error('Item not found ' + item.id);
    }
    return i;
  },
  idFromItem: (item) => item.id,
  insertItemInPlace: (data, itemInfo, target) => {
    const res = insertItemIntoGroup(data, target, itemInfo.group, itemInfo.index);
    if (!res) {
      throw new Error('Item not inserted ' + itemInfo.group + ' ' + itemInfo.index);
    }
    return res;
  },
});
</script>
