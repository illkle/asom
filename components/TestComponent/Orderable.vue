<template>
  <motion.div
    v-if="!draggedItem"
    v-bind="$attrs"
    layout
    :layout-id="props.id"
    :class="[props.class, props.disabled && 'pointer-events-none']"
    @pointerdown.stop="
      (e) => {
        startDrag(e, {
          id: props.id,
          type: props.type,
        });
      }
    "
  >
    <slot :is-over="false" :can-drop="false" :is-dragging-me="isDraggingMe" />
  </motion.div>
  <motion.div
    v-else-if="isDraggingMe && isAway"
    v-bind="$attrs"
    :class="[props.class, 'opacity-10', props.disabled && 'pointer-events-none']"
    :data-can-drop="canDrop && isOver"
    :data-is-over="isOver"
    @pointerenter="
      handleDragEnter({ group: props.group, index: props.index, priority: props.priority ?? 0 })
    "
    @pointerleave="
      handleDragLeave({ group: props.group, index: props.index, priority: props.priority ?? 0 })
    "
    @dragover=""
  >
    <slot :is-over="isOver" :can-drop="canDrop" :is-dragging-me="isDraggingMe" />
  </motion.div>
  <motion.div
    v-else
    v-bind="$attrs"
    layout
    :layout-id="props.id"
    :class="[props.class, props.disabled && 'pointer-events-none']"
    :data-can-drop="canDrop && isOver"
    :data-is-over="isOver"
    @pointerenter="
      handleDragEnter({ group: props.group, index: props.index, priority: props.priority ?? 0 })
    "
    @pointerleave="
      handleDragLeave({ group: props.group, index: props.index, priority: props.priority ?? 0 })
    "
    @dragover=""
  >
    <slot :is-over="isOver" :can-drop="canDrop" :is-dragging-me="isDraggingMe" />
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
  acceptedTypes: DraggedItemInfo['type'][];
  id: DraggedItemInfo['id'];
  type: DraggedItemInfo['type'];
  group: HoveredItemInfo['group'];
  index: HoveredItemInfo['index'];
  priority?: HoveredItemInfo['priority'];
  class?: string;
  disabled?: boolean;
}>();

const { draggedItem, hoveredItem, startDrag, handleDragEnter, handleDragLeave } = useCoolDndContext<
  unknown,
  DraggedItemInfo
>();

const canDrop = computed(() => {
  if (!draggedItem.value) return false;
  if (!draggedItem.value.type) return true;
  return props.acceptedTypes.includes(draggedItem.value.type);
});

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

const isPlacedHere = computed(() => {
  return isOver.value && isDraggingMe.value;
});

const isAway = computed(() => {
  return isDraggingMe.value && !isPlacedHere.value;
});
</script>
