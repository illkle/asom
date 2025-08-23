<template>
  <ContextMenuItem @click="emit('openInNewTab')">
    <CornerUpRight :size="16" /> Open In New Tab
  </ContextMenuItem>

  <template v-if="!selectionMode">
    <ContextMenuItem @click="emit('select')">
      <SquareDashedMousePointer :size="16" /> Select
    </ContextMenuItem>
    <ContextMenuItem @click="emit('delete')">
      <TrashIcon :size="16" />
      Delete
    </ContextMenuItem>
  </template>
</template>

<script setup lang="ts">
import { CornerUpRight, SquareDashedMousePointer, TrashIcon } from 'lucide-vue-next';

const props = defineProps<{
  selectionMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'openInNewTab'): void;
  (e: 'select'): void;
  (e: 'delete'): void;
}>();
</script>
