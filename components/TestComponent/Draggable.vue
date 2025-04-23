<template>
  <motion.div
    v-bind="$attrs"
    layout
    :layout-id="props.info.id"
    :transition="{
      duration: 0,
    }"
    @pointerdown="
      (e) => {
        emit('pointerdown', e);
        startDrag(e, props.info);
      }
    "
  >
    <slot />
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';
import { useCoolDndContext, type DraggedItemInfo } from './common';

const props = defineProps<{
  info: DraggedItemInfo;
}>();

const emit = defineEmits<{
  (e: 'pointerdown', event: PointerEvent): void;
}>();

const { startDrag } = useCoolDndContext<unknown, DraggedItemInfo>();
</script>
