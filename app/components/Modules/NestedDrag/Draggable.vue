<template>
  <div v-if="isDraggingMe" ref="measureRef"></div>
  <motion.div
    ref="constraintsRef"
    v-bind="$attrs"
    layout
    :animate="{
      x: offset.x,
      y: offset.y,
      transition: {
        duration: isDraggingMe ? 0 : undefined,
      },
    }"
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
import { useDraggable, type DraggableProps } from '~/components/Modules/NestedDrag/useDraggable';

const props = defineProps<DraggableProps>();

const constraintsRef = useDomRef() as Ref<HTMLDivElement>;
const measureRef = useTemplateRef('measureRef');

const { isDraggingMe, offset, pointerDown } = useDraggable(props, constraintsRef);
</script>
