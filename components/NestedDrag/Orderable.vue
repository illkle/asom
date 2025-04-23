<template>
  <motion.div
    v-bind="$attrs"
    layout
    :animate="{
      x: offset.x * (isDraggingMe ? 1 : 0),
      y: offset.y * (isDraggingMe ? 1 : 0),
      zIndex: isDraggingMe ? 9999 : 0,
    }"
    :transition="{
      x: {
        duration: isDraggingMe ? 0 : 0.3,
      },
      y: {
        duration: isDraggingMe ? 0 : 0.3,
      },
      zIndex: {
        duration: 0,
        delay: isDraggingMe ? 0 : 0.3,
      },
    }"
    :layout-id="props.id"
    :data-is-over="isOver"
    :data-is-dragging-me="isDraggingMe"
    :class="[
      props.class,
      (props.disabled || isDraggingMe) && 'pointer-events-none',
      !props.disabled && 'cursor-grab',
    ]"
    @pointerdown.stop="
      (e) => {
        if (draggedItem) return;
        startDrag(e, {
          id: props.id,
          type: props.type,
        });
      }
    "
    @pointerenter="
      () => {
        if (!draggedItem || isDraggingMe) return;
        handleDragEnter({ group: props.group, index: props.index, priority: props.priority ?? 0 });
      }
    "
    @pointerleave="
      () => {
        if (!draggedItem || isDraggingMe) return;
        handleDragLeave({ group: props.group, index: props.index, priority: props.priority ?? 0 });
      }
    "
  >
    <slot :is-over="isOver" :is-dragging-me="isDraggingMe" />
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';
import {
  compareDraggedInfo,
  compareHoveredInfo,
  useCoolDndContext,
  type DraggedItemInfo,
  type HoveredItemInfo,
} from './common';

const props = defineProps<{
  id: DraggedItemInfo['id'];
  type: DraggedItemInfo['type'];
  group: HoveredItemInfo['group'];
  index: HoveredItemInfo['index'];
  priority?: HoveredItemInfo['priority'];
  class?: string;
  disabled?: boolean;
}>();

const { draggedItem, hoveredItem, startDrag, handleDragEnter, handleDragLeave, offset } =
  useCoolDndContext<unknown, DraggedItemInfo>();

const isOver = computed(() => {
  if (!hoveredItem.value) return false;
  return compareHoveredInfo(hoveredItem.value, {
    group: props.group,
    index: props.index,
    priority: props.priority ?? 0,
  });
});

const isDraggingMe = computed(() => {
  if (!draggedItem.value) return false;
  return compareDraggedInfo(draggedItem.value, {
    id: props.id,
    type: props.type,
  });
});
</script>
