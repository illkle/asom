<template>
  <DropTarget
    :parentIds="parentIds"
    :disabled="disabled"
    :id="id"
    :acceptedTypes="acceptedTypes"
    :class="[isDraggingMyChild && 'bg-red-500 z-50']"
    :to-slot="true"
  >
    <Draggable :id="id" :type="type" :parentIds="parentIds" :class="dragClass">
      <template #default="{ isDraggingMe }">
        <slot :is-dragging-me="isDraggingMe" />
      </template>
    </Draggable>
  </DropTarget>
</template>

<script setup lang="ts">
import type { AllowedComponentProps } from 'vue';
import { type DraggableInfo, type DropTargetInfo, useCoolDndContext } from './common';
import Draggable from './Draggable.vue';
import DropTarget from './DropTarget.vue';

const props = defineProps<{
  id: DraggableInfo['id'];
  type: DraggableInfo['type'];
  parentIds: DraggableInfo['parentIds'];
  disabled?: boolean;
  dragClass?: AllowedComponentProps['class'];
  acceptedTypes?: DropTargetInfo['acceptedTypes'];
}>();

const { draggedItem } = useCoolDndContext<unknown, DraggableInfo>();

const isDraggingMyChild = computed(() => {
  return draggedItem.value?.parentIds.includes(props.id);
});
</script>
