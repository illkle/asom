<template>
  <div
    ref="el"
    v-bind="$attrs"
    :class="[props.disabled && 'pointer-events-none', '']"
    :data-can-drop="isOver"
    :data-is-over="isOver"
    :data-quadrant="hoveredItem?.quadrant"
    @dragover=""
  >
    <slot :is-over="isOver" :quadrant="hoveredItem?.quadrant" />
  </div>
</template>

<script setup lang="ts">
import { useDropTarget, type DropTargetProps } from '~/components/Modules/NestedDrag/useDropTarget';
import { type DropTargetInfo } from './common';

const props = defineProps<DropTargetProps>();

const el = useTemplateRef<HTMLDivElement>('el');

const { isOver, hoveredItem } = useDropTarget(props, el);
</script>
