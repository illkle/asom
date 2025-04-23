<template>
  <div
    class="p-2 data-[dragging=true]:border-accent-foreground border data-[can-drop=true]:bg-red-500"
  >
    <template v-if="props.item.type === 'group'">
      Group {{ props.item.id }}

      <div class="flex flex-col gap-2">
        <template v-if="props.item.content.length">
          <Orderable
            v-for="(p, index) in props.item.content"
            :key="p.id"
            :group="props.item.id"
            :id="p.id"
            :type="commonType"
            :index="index"
            :priority="props.level"
            :accepted-types="[commonType]"
            :disabled="props.disabled"
            :layout-prefix="props.layoutPrefix"
          >
            <template #default="{ isOver, canDrop, isDraggingMe }">
              <div
                v-if="p.type === 'string'"
                :class="[isOver && 'bg-blue-300', 'p-2 border w-fit cursor-grab']"
              >
                {{ p.id }}
              </div>
              <TestGroup
                v-else
                :item="p"
                :level="props.level + 1"
                :disabled="isDraggingMe"
                :layout-prefix="props.layoutPrefix"
                :class="[
                  isOver && 'bg-blue-300',
                  'p-2 border w-fit cursor-grab',
                  isDraggingMe && 'opacity-50',
                ]"
              />
            </template>
          </Orderable>
        </template>

        <TestComponentDropTarget
          v-else
          :accepted-types="[commonType]"
          :group="props.item.id"
          :index="props.item.content.length"
          :priority="props.level + 1"
        >
          <template #default="{ isOver, canDrop }">
            <div :class="['h-10 border', isOver && 'bg-blue-300']" />
          </template>
        </TestComponentDropTarget>
      </div>
    </template>
    <template v-else>
      {{ props.item.id }}
    </template>
  </div>
</template>

<script setup lang="ts">
import Orderable from './Orderable.vue';
import type { Item } from './dataShape';
const commonType = 'test';

const props = defineProps<{
  item: Item;
  level: number;
  disabled?: boolean;
  layoutPrefix?: string;
}>();
</script>
