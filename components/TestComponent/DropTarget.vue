<template>
  <motion.div
    v-bind="$attrs"
    :class="props.class"
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
    <slot :is-over="isOver" :can-drop="canDrop" />
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';
import {
  compareHoveredInfo,
  useCoolDndContext,
  type DraggedItemInfo,
  type HoveredItemInfo,
} from './common';

const props = defineProps<{
  acceptedTypes: DraggedItemInfo['type'][];
  group: HoveredItemInfo['group'];
  index: HoveredItemInfo['index'];
  priority?: HoveredItemInfo['priority'];
  class?: string;
}>();

const { draggedItem, hoveredItem, handleDragEnter, handleDragLeave } = useCoolDndContext<
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
</script>
