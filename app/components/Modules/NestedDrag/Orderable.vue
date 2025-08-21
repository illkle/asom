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
    :class="[props.disabled ? 'pointer-events-none' : 'cursor-grab', isDraggingMyChild && ' z-50']"
    :data-can-drop="isOver"
    :data-is-over="isOver"
    :data-quadrant="hoveredItem?.quadrant"
    @dragover=""
    @pointerdown.stop="pointerDown"
  >
    <slot :is-dragging-me="isDraggingMe" :is-over="isOver" :quadrant="hoveredItem?.quadrant" />
  </motion.div>
</template>

<script setup lang="ts">
import { motion, useDomRef } from 'motion-v';
import type { AllowedComponentProps } from 'vue';
import { useDraggable } from '~/components/Modules/NestedDrag/useDraggable';
import { useDropTarget } from '~/components/Modules/NestedDrag/useDropTarget';
import { type DraggableInfo, type DropTargetInfo, useCoolDndContext } from './common';

const props = defineProps<{
  id: DraggableInfo['id'];
  type: DraggableInfo['type'];
  parentIds: DraggableInfo['parentIds'];
  disabled?: boolean;
  dragClass?: AllowedComponentProps['class'];
  acceptedTypes?: DropTargetInfo['acceptedTypes'];
}>();

const { draggedItem } = useCoolDndContext<unknown, DraggableInfo>();

const constraintsRef = useDomRef() as Ref<HTMLDivElement>;
const measureRef = useTemplateRef('measureRef');

const isDraggingMyChild = computed(() => {
  return draggedItem.value?.parentIds.includes(props.id);
});

const { isDraggingMe, offset, pointerDown } = useDraggable(props, constraintsRef, measureRef);

const { isOver, hoveredItem } = useDropTarget(props, constraintsRef);
</script>
