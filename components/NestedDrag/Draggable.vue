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
import { useCoolDndContext, type DraggableInfo } from './common';

const props = defineProps<{
  id: DraggableInfo['id'];
  type: DraggableInfo['type'];
  parentIds: DraggableInfo['parentIds'];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'pointerdown', event: PointerEvent): void;
}>();

const {
  startDrag,
  draggedItem,
  dropTargets: elementRepository,
} = useCoolDndContext<unknown, DraggableInfo>();

const isDraggingMe = computed(() => {
  return draggedItem.value?.id === props.id;
});

const pointerDown = (e: PointerEvent) => {
  if (!constraintsRef.value) return;

  startDrag(
    e,
    { id: props.id, type: props.type, parentIds: props.parentIds },
    constraintsRef.value,
  );
};

const constraintsRef = useDomRef();
</script>
