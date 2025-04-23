<template>
  <motion.div
    v-bind="$attrs"
    :class="[props.class, props.disabled && 'pointer-events-none']"
    :data-can-drop="isOver"
    :data-is-over="isOver"
    @pointerenter="
      handleDragEnter({ group: props.group, index: props.index, priority: props.priority ?? 0 })
    "
    @pointerleave="
      handleDragLeave({ group: props.group, index: props.index, priority: props.priority ?? 0 })
    "
    @dragover=""
  >
    <slot :is-over="isOver" />
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
  group: HoveredItemInfo['group'];
  index: HoveredItemInfo['index'];
  priority?: HoveredItemInfo['priority'];
  class?: string;
  disabled?: boolean;
}>();

const { draggedItem, hoveredItem, handleDragEnter, handleDragLeave } = useCoolDndContext<
  unknown,
  DraggedItemInfo
>();

const isOver = computed(() => {
  if (!hoveredItem.value) return false;
  return compareHoveredInfo(hoveredItem.value, {
    group: props.group,
    index: props.index,
    priority: props.priority ?? 0,
  });
});
</script>
