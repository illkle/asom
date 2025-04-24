<template>
  <DropTarget :group="group" :index="index" :priority="priority" :disabled="disabled">
    <Draggable
      :id="id"
      :type="type"
      :group="group"
      :index="index"
      :priority="priority"
      :class="dragClass"
      :location="location"
    >
      <template #default="{ isDraggingMe }">
        <slot :is-dragging-me="isDraggingMe" />
      </template>
    </Draggable>
  </DropTarget>
</template>

<script setup lang="ts">
import type { AllowedComponentProps } from 'vue';
import { type DraggedItemInfo, type HoveredItemInfo } from './common';
import Draggable from './Draggable.vue';
import DropTarget from './DropTarget.vue';
const props = defineProps<{
  id: DraggedItemInfo['id'];
  type: DraggedItemInfo['type'];
  group: HoveredItemInfo['group'];
  index: HoveredItemInfo['index'];
  priority?: HoveredItemInfo['priority'];
  disabled?: boolean;
  dragClass?: AllowedComponentProps['class'];
  location: DraggedItemInfo['location'];
}>();
</script>
