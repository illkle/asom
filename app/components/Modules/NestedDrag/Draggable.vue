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
import { useCoolDndContext, type DraggableInfo } from './common';

const props = defineProps<{
  id: DraggableInfo['id'];
  type: DraggableInfo['type'];
  parentIds: DraggableInfo['parentIds'];
  disabled?: boolean;
}>();

const constraintsRef = useDomRef();
const measureRef = useTemplateRef('measureRef');

const {
  startDrag,
  draggedItem,
  dropTargets: elementRepository,
  cursorPosition,
} = useCoolDndContext<unknown, DraggableInfo>();

const isDraggingMe = computed(() => {
  return draggedItem.value?.id === props.id;
});

const pos = ref({
  leftStart: 0,
  topStart: 0,
  leftCurrent: 0,
  topCurrent: 0,
  cursorStartX: 0,
  cursorStartY: 0,
});

const offset = computed(() => {
  if (!isDraggingMe.value) {
    return {
      x: 0,
      y: 0,
    };
  }

  return {
    x:
      pos.value.leftStart -
      pos.value.leftCurrent +
      (cursorPosition.value.x - pos.value.cursorStartX),
    y:
      pos.value.topStart - pos.value.topCurrent + (cursorPosition.value.y - pos.value.cursorStartY),
  };
});

const pointerDown = (e: PointerEvent) => {
  console.log('pointerDown', props.id);
  if (!constraintsRef.value) return;
  e.preventDefault();

  pos.value.cursorStartX = e.clientX;
  pos.value.cursorStartY = e.clientY;

  startDrag(
    e,
    { id: props.id, type: props.type, parentIds: props.parentIds },
    constraintsRef.value,
  );

  nextTick(() => {
    if (!measureRef.value) return;
    const rect = measureRef.value.getBoundingClientRect();

    pos.value.leftStart = rect.left;
    pos.value.topStart = rect.top;
    pos.value.leftCurrent = rect.left;
    pos.value.topCurrent = rect.top;
  });

  document.addEventListener('scroll', scrollAnywhere, { capture: true });
  document.addEventListener('pointerup', pointerUp, { once: true });
};

const scrollAnywhere = () => {
  if (!measureRef.value) return;
  const rect = measureRef.value.getBoundingClientRect();
  pos.value.leftCurrent = rect.left;
  pos.value.topCurrent = rect.top;
};

const pointerUp = () => {
  document.removeEventListener('scroll', scrollAnywhere, { capture: true });
  pos.value = {
    leftStart: 0,
    topStart: 0,
    leftCurrent: 0,
    topCurrent: 0,
    cursorStartX: 0,
    cursorStartY: 0,
  };
};
</script>
