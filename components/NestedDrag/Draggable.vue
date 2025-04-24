<template>
  <motion.div
    ref="constraintsRef"
    v-bind="$attrs"
    layout
    drag
    :drag-snap-to-origin="true"
    :layout-id="props.id"
    :data-is-dragging-me="isDraggingMe"
    :class="[!props.disabled && 'cursor-grab']"
    @pointerdown.stop="pointerDown"
  >
    <slot :is-dragging-me="isDraggingMe" />
  </motion.div>
</template>

<script setup lang="ts">
import { motion, useDomRef } from 'motion-v';
import { compareDraggedInfo, useCoolDndContext, type DraggedItemInfo } from './common';

const props = defineProps<{
  id: DraggedItemInfo['id'];
  type: DraggedItemInfo['type'];
  userFlags?: DraggedItemInfo['userFlags'];
  location: DraggedItemInfo['location'];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'pointerdown', event: PointerEvent): void;
}>();

const dc = useDragControls();

const { startDrag, draggedItem, elementRepository } = useCoolDndContext<unknown, DraggedItemInfo>();

const isDraggingMe = computed(() => {
  if (!draggedItem.value) return false;
  return compareDraggedInfo(draggedItem.value, {
    id: props.id,
    type: props.type,
    location: props.location,
  });
});

const pointerDown = (e: PointerEvent) => {
  if (!constraintsRef.value) return;

  startDrag(e, { id: props.id, type: props.type, location: props.location }, constraintsRef.value);
};

const constraintsRef = useDomRef();
</script>
