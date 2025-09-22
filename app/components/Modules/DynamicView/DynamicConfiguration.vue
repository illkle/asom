<template>
  <LayoutGroup v-if="layout">
    <MotionConfig :transition="{ duration: 0.2, type: 'tween' }">
      <RenderDynamicEditor
        :item="layout"
        :level="0"
        :index="0"
        class="border rounded-md rounded-b-none grow data-[is-over=true]:bg-accent"
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
import { cloneDeep } from 'lodash-es';
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
  schema: Schema;
  layout: IDynamicViewGroup;
}>();

const emit = defineEmits<{
  (e: 'update:layout', layout: IDynamicViewGroup): void;
}>();

const { draggedItem } = useProvideDNDContext({
  onMove: (draggedItem, hoveredItem, quadrant) => {
    if (!props.layout) return;

    const newState = cloneDeep(props.layout);

    if (hoveredItem.id === 'toDelete') {
      const i = findAndRemoveItem(newState, draggedItem);

      if (!i) {
        throw new Error('Item not found ' + draggedItem.id);
      }
    } else if (draggedItem.parentIds[0] === 'external') {
      const i = availableItems.value.find((id) => id.id === draggedItem.id);

      if (!i) {
        throw new Error('Item not found ' + draggedItem.id);
      }

      insertItemIntoGroup(newState, i, hoveredItem, quadrant);
    } else {
      swapItems(newState, draggedItem, hoveredItem, quadrant);
    }

    emit('update:layout', newState);
  },
});

const onDelete = (info: ItemInfoCore) => {
  if (!props.layout) return;

  const newState = cloneDeep(props.layout);

  findAndRemoveItem(newState, info);

  emit('update:layout', newState);
};

const flatItems = computed(() => {
  if (!props.layout) return new Set();
  return new Set(getFlatItems(props.layout).map((v) => v.id));
});

const availableItems = computed<ILayoutItem[]>(() => {
  return props.schema.items
    .filter((v) => !flatItems.value.has(v.name))
    .map((attr) => ({
      id: attr.name,
      type: 'item',
    }));
});
</script>
