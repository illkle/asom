<template>
  <LayoutGroup>
    <MotionConfig :transition="{ duration: 0.3, type: 'tween' }">
      <DynamicViewRenderDynamicEditor
        :item="props.layout.value"
        :level="0"
        :index="0"
        class="border rounded-md grow data-[is-over=true]:bg-accent"
        @delete="onDelete"
        :parentIds="[]"
      >
        <template #item="{ item }">
          <slot name="item" :item="item" />
        </template>
      </DynamicViewRenderDynamicEditor>

      <NestedDragDropTarget
        id="toDelete"
        :parentIds="[]"
        :index="0"
        class="mr-2 border bg-accent flex items-center justify-center h-10 gap-2 data-[disabled=true]:opacity-30 data-[disabled=true]:cursor-not-allowed transition-opacity"
        :data-disabled="!draggedItem"
      >
        <Trash2Icon :size="16" /> Drag here to delete
      </NestedDragDropTarget>

      <div class="flex gap-2 items-center">
        <NestedDragDraggable
          v-for="(value, index) in props.availableItems.value"
          :id="value.id"
          :type="value.type"
          :parentIds="['external']"
          :user-flags="{ external: 'true' }"
          :location="['availableItems', value.id]"
        >
          <div class="border rounded-md px-2 py-1.5 min-w-20">{{ value.id }}</div>
        </NestedDragDraggable>
      </div>
    </MotionConfig>
  </LayoutGroup>
</template>

<script setup lang="ts">
import { Trash2Icon } from 'lucide-vue-next';
import { useProvideDNDContext, type ItemInfoCore } from '~/components/NestedDrag/common';
import {
  findAndRemoveItem,
  insertItemIntoGroup,
  swapItems,
  type IDynamicViewGroup,
  type ILayoutItem,
} from './helpers';

const props = defineProps<{
  layout: Ref<IDynamicViewGroup>;
  availableItems: Ref<ILayoutItem[]>;
}>();

const { draggedItem, dropTargets: elementRepository } = useProvideDNDContext({
  onMove: (draggedItem, hoveredItem) => {
    console.log('onMove', draggedItem, hoveredItem);
    if (hoveredItem.id === 'toDelete') {
      const i = findAndRemoveItem(props.layout.value, draggedItem);

      if (!i) {
        throw new Error('Item not found ' + draggedItem.id);
      }

      return;
    }

    if (draggedItem.parentIds[0] === 'external') {
      const i = props.availableItems.value.find((id) => id.id === draggedItem.id);

      if (!i) {
        throw new Error('Item not found ' + draggedItem.id);
      }

      insertItemIntoGroup(props.layout.value, i, hoveredItem);

      return;
    }

    swapItems(props.layout.value, draggedItem, hoveredItem);
  },
});

const onDelete = (info: ItemInfoCore) => {
  findAndRemoveItem(props.layout.value, info);
};
</script>
