<template>
  <LayoutGroup>
    <MotionConfig :transition="{ duration: 0.3, type: 'tween' }">
      <DynamicViewRenderDynamicEditor
        :item="props.layout.value"
        :level="0"
        class="border rounded-md grow data-[is-over=true]:bg-accent"
        @delete="onDelete"
        :location="[]"
      >
        <template #item="{ item }">
          <slot name="item" :item="item" />
        </template>
      </DynamicViewRenderDynamicEditor>

      <div class="flex gap-2 items-center">
        <NestedDragDropTarget group="toDelete" :index="0" class="mr-2">
          <Button :disabled="!draggedItem" variant="destructive">Delete</Button>
        </NestedDragDropTarget>
        <NestedDragDraggable
          v-for="value in props.availableItems.value"
          :id="value.id"
          :type="value.type"
          :user-flags="{ external: 'true' }"
          :location="['availableItems', value.id]"
        >
          <div class="border rounded-md px-2 py-1.5 min-w-20">{{ value.id }}</div>
        </NestedDragDraggable>
      </div>
    </MotionConfig>
  </LayoutGroup>

  {{ starterDragInfo }}

  <div
    :style="{
      top: draggedRect.topLeft.y + 'px',
      left: draggedRect.topLeft.x + 'px',
      width: draggedRect.bottomRight.x - draggedRect.topLeft.x + 'px',
      height: draggedRect.bottomRight.y - draggedRect.topLeft.y + 'px',
    }"
    class="fixed bg-red-600 z-100 opacity-15 pointer-events-none"
  >
    hello
  </div>
</template>

<script setup lang="ts">
import { useProvideDNDContext } from '../NestedDrag/common';
import {
  findAndRemoveItem,
  insertItemIntoGroup,
  type IDynamicViewGroup,
  type ILayoutItem,
} from './helpers';

const props = defineProps<{
  layout: Ref<IDynamicViewGroup>;
  availableItems: Ref<ILayoutItem[]>;
}>();

const { draggedItem, elementRepository, hoveredId, starterDragInfo, draggedRect } =
  useProvideDNDContext({
    onMove: (draggedItem, hoveredItem) => {
      if (hoveredItem.group === 'toDelete') {
        const i = findAndRemoveItem(props.layout.value, draggedItem.id);

        if (!i) {
          throw new Error('Item not found ' + draggedItem.id);
        }

        return;
      }

      if (draggedItem.userFlags?.external) {
        const i = props.availableItems.value.find((id) => id.id === draggedItem.id);

        if (!i) {
          throw new Error('Item not found ' + draggedItem.id);
        }

        insertItemIntoGroup(props.layout.value, i, hoveredItem.group, hoveredItem.index);

        return;
      }

      const i = findAndRemoveItem(props.layout.value, draggedItem.id);

      if (!i) {
        throw new Error('Item not found ' + draggedItem.id);
      }

      insertItemIntoGroup(props.layout.value, i, hoveredItem.group, hoveredItem.index);
    },
  });

const onDelete = (id: string) => {
  findAndRemoveItem(props.layout.value, id);
};
</script>
