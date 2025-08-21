<template>
  <LayoutGroup>
    <MotionConfig :transition="{ duration: 0.2, type: 'tween' }">
      <RenderDynamicEditor
        :item="layoutValue"
        :level="0"
        :index="0"
        class="border rounded-md rounded-b-none grow data-[is-over=true]:bg-accent mt-4"
        @delete="onDelete"
        :parentIds="[]"
      >
        <template #item="{ item }">
          <slot name="item" :item="item" />
        </template>
      </RenderDynamicEditor>

      <DropTarget
        id="toDelete"
        :parentIds="[]"
        :index="0"
        class="group rounded-t-none border border-t-0 text-sm rounded-md flex items-center justify-center h-10 data-[disabled=true]:cursor-not-allowed transition-colors data-[is-over=true]:bg-accent"
        :data-disabled="!draggedItem"
      >
        <span
          class="group-data-[disabled=true]:opacity-30 flex gap-2 items-center transition-opacity"
        >
          <Trash2Icon :size="16" /> Drag here to delete
        </span>
      </DropTarget>

      <div class="flex flex-col gap-2 w-fit">
        <Draggable
          v-for="(value, index) in availableItems"
          :key="value.id"
          :id="value.id"
          :type="value.type"
          :parentIds="['external']"
          :user-flags="{ external: 'true' }"
        >
          <slot name="item" :item="value" />
        </Draggable>
      </div>
    </MotionConfig>
  </LayoutGroup>
</template>

<script setup lang="ts">
import { Trash2Icon } from 'lucide-vue-next';
import { useProvideDNDContext, type ItemInfoCore } from '~/components/Modules/NestedDrag/common';
import type { Schema } from '~/types';
import { Draggable, DropTarget } from '../NestedDrag';
import {
  findAndRemoveItem,
  getFlatItems,
  insertItemIntoGroup,
  swapItems,
  type IDynamicViewGroup,
  type ILayoutItem,
} from './helpers';
import RenderDynamicEditor from './RenderDynamicEditor.vue';

const props = defineProps<{
  layout: IDynamicViewGroup;
  schema: Schema;
}>();

const layoutValue = defineModel<IDynamicViewGroup>('layout');

const { draggedItem, dropTargets: elementRepository } = useProvideDNDContext({
  onMove: (draggedItem, hoveredItem, quadrant) => {
    console.log('onMove', draggedItem, hoveredItem);
    if (hoveredItem.id === 'toDelete') {
      const i = findAndRemoveItem(layoutValue.value, draggedItem);

      if (!i) {
        throw new Error('Item not found ' + draggedItem.id);
      }

      return;
    }

    if (draggedItem.parentIds[0] === 'external') {
      const i = availableItems.value.find((id) => id.id === draggedItem.id);

      if (!i) {
        throw new Error('Item not found ' + draggedItem.id);
      }

      insertItemIntoGroup(layoutValue.value, i, hoveredItem, quadrant);

      return;
    }

    swapItems(layoutValue.value, draggedItem, hoveredItem, quadrant);
  },
});

const flatItems = computed(() => {
  return new Set(getFlatItems(layoutValue.value).map((v) => v.id));
});

const availableItems = computed<ILayoutItem[]>(() => {
  return props.schema.items
    .filter((v) => !flatItems.value.has(v.name))
    .map((attr) => ({
      id: attr.name,
      type: 'item',
    }));
});

const onDelete = (info: ItemInfoCore) => {
  findAndRemoveItem(layoutValue.value, info);
};
</script>
