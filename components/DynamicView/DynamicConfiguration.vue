<template>
  <LayoutGroup>
    <div class="flex gap-2 mt-2">
      <Button variant="outline" class="grow" @click="emit('update:layout', innerValue)">
        <SaveIcon /> Save
      </Button>
      <Button variant="outline" class="grow" @click="emit('discard')"> <XIcon /> Discard </Button>
    </div>
    <MotionConfig :transition="{ duration: 0.2, type: 'tween' }">
      <DynamicViewRenderDynamicEditor
        :item="innerValue"
        :level="0"
        :index="0"
        class="border rounded-md grow data-[is-over=true]:bg-accent mt-4"
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
        class="mr-2 mt-2 border rounded-md flex items-center justify-center h-10 gap-2 data-[disabled=true]:opacity-30 data-[disabled=true]:cursor-not-allowed transition-opacity data-[is-over=true]:bg-accent"
        :data-disabled="!draggedItem"
      >
        <Trash2Icon :size="16" /> Drag here to delete
      </NestedDragDropTarget>

      <div class="flex flex-col gap-2 w-fit">
        <NestedDragDraggable
          v-for="(value, index) in availableItems"
          :key="value.id"
          :id="value.id"
          :type="value.type"
          :parentIds="['external']"
          :user-flags="{ external: 'true' }"
        >
          <slot name="item" :item="value" />
        </NestedDragDraggable>
      </div>
    </MotionConfig>
  </LayoutGroup>
</template>

<script setup lang="ts">
import { SaveIcon, Trash2Icon, XIcon } from 'lucide-vue-next';
import { useProvideDNDContext, type ItemInfoCore } from '~/components/NestedDrag/common';
import type { Schema } from '~/types';
import {
  findAndRemoveItem,
  getFlatItems,
  insertItemIntoGroup,
  swapItems,
  type IDynamicViewGroup,
  type ILayoutItem,
} from './helpers';

const props = defineProps<{
  layout: IDynamicViewGroup;
  schema: Schema;
}>();

const emit = defineEmits<{
  (e: 'update:layout', layout: IDynamicViewGroup): void;
  (e: 'discard'): void;
}>();

const innerValue = ref(props.layout);

const { draggedItem, dropTargets: elementRepository } = useProvideDNDContext({
  onMove: (draggedItem, hoveredItem, quadrant) => {
    console.log('onMove', draggedItem, hoveredItem);
    if (hoveredItem.id === 'toDelete') {
      const i = findAndRemoveItem(innerValue.value, draggedItem);

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

      insertItemIntoGroup(innerValue.value, i, hoveredItem, quadrant);

      return;
    }

    swapItems(innerValue.value, draggedItem, hoveredItem, quadrant);
  },
});

const flatItems = computed(() => {
  return new Set(getFlatItems(innerValue.value).map((v) => v.id));
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
  findAndRemoveItem(innerValue.value, info);
};
</script>
