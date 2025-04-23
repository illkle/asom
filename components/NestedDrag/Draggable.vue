<template>
  <motion.div
    v-bind="$attrs"
    layout
    :layout-id="props.id"
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
    :data-is-dragging-me="isDraggingMe"
    :class="[
      props.class,
      (props.disabled || isDraggingMe) && 'pointer-events-none',
      !props.disabled && 'cursor-grab',
    ]"
    @pointerdown="
      (e) => {
        emit('pointerdown', e);
        startDrag(e, {
          id: props.id,
          type: props.type,
          userFlags: props.userFlags,
        });
      }
    "
  >
    <slot />
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';
import { compareDraggedInfo, useCoolDndContext, type DraggedItemInfo } from './common';

const props = defineProps<{
  id: DraggedItemInfo['id'];
  type: DraggedItemInfo['type'];
  userFlags?: DraggedItemInfo['userFlags'];
  class?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'pointerdown', event: PointerEvent): void;
}>();

const { startDrag, draggedItem, offset } = useCoolDndContext<unknown, DraggedItemInfo>();

const isDraggingMe = computed(() => {
  if (!draggedItem.value) return false;
  return compareDraggedInfo(draggedItem.value, {
    id: props.id,
    type: props.type,
  });
});
</script>
