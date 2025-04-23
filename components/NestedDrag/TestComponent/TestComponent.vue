<template>
  <div class="flex gap-2">
    <NestedDragTestComponentTestGroup :item="groups" :level="0" class="p-2 border">
    </NestedDragTestComponentTestGroup>
  </div>

  <NestedDragDraggable
    v-for="id in idsToAdd"
    :id="id.id"
    :type="id.type"
    :user-flags="{ external: 'true' }"
    class="p-2 border"
  >
    {{ id }}
  </NestedDragDraggable>

  {{ groups }}

  <div>
    {{ hoveredItem }}
  </div>

  {{ offset }}
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useProvideDNDContext } from '../common';
import {
  findAndRemoveItem,
  insertItemIntoGroup,
  sampleData,
  type ContentGroup,
  type Item,
} from './dataShape';

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

const idsToAdd = ref<Item[]>([
  { id: '11111', type: 'string', data: '11111' },
  { id: '22222', type: 'string', data: '22222' },
  { id: '33333', type: 'string', data: '33333' },
  { id: '44444', type: 'string', data: '44444' },
  { id: '55555', type: 'string', data: '55555' },
]);

const { offset, starterPosition, draggedItem, hoveredItem } = useProvideDNDContext({
  onMove: (draggedItem, hoveredItem) => {
    if (draggedItem.userFlags?.external) {
      const index = idsToAdd.value.findIndex((id) => id.id === draggedItem.id);

      if (index === -1) {
        throw new Error('Item not found ' + draggedItem.id);
      }

      const i = idsToAdd.value.splice(index, 1)[0];
      insertItemIntoGroup(groups.value, i, hoveredItem.group, hoveredItem.index);

      return;
    }

    const i = findAndRemoveItem(groups.value, draggedItem.id);

    if (!i) {
      throw new Error('Item not found ' + draggedItem.id);
    }

    insertItemIntoGroup(groups.value, i, hoveredItem.group, hoveredItem.index);
  },
});
</script>
