<template>
  <motion.div
    ref="el"
    v-bind="$attrs"
    :class="[props.class, props.disabled && 'pointer-events-none', 'relative']"
    :data-can-drop="isOver"
    :data-is-over="isOver"
    @dragover=""
  >
    <slot :is-over="isOver" />
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';
import {
  useCoolDndContext,
  type DraggedItemInfo,
  type CornerPositionData,
  type HoveredItemInfo,
} from './common';
import { useElementBounding, useMouseInElement } from '@vueuse/core';

const props = defineProps<{
  group: HoveredItemInfo['group'];
  index: HoveredItemInfo['index'];
  priority?: HoveredItemInfo['priority'];
  class?: string;
  disabled?: boolean;
}>();

const { draggedItem, elementRepository, hoveredId } = useCoolDndContext<unknown, DraggedItemInfo>();

const isOver = computed(() => {
  return hoveredId.value === key.value;
});

const el = useTemplateRef('el');

const { x, y, top, right, bottom, left, width, height } = useElementBounding(el, {
  updateTiming: 'sync',
});

const computeInfo = computed<CornerPositionData>(() => {
  return {
    topLeft: { x: left.value, y: top.value },
    topRight: { x: left.value + width.value, y: top.value },
    bottomLeft: { x: left.value, y: top.value + height.value },
    bottomRight: { x: left.value + width.value, y: top.value + height.value },
  };
});

const key = computed(() => {
  return props.group + '-' + props.index;
});

onMounted(() => {
  elementRepository.value[key.value] = computeInfo;
});

onUnmounted(() => {
  delete elementRepository.value[key.value];
});
</script>
