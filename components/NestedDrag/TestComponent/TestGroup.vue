<template>
  <div>
    <template v-if="props.item.type === 'group'">
      Group {{ props.item.id }}

      <div class="flex flex-col gap-2">
        <LayoutGroup>
          <template v-if="props.item.content.length">
            <Orderable
              v-for="(p, index) in props.item.content"
              :key="p.id"
              :group="props.item.id"
              :id="p.id"
              :type="commonType"
              :index="index"
              :priority="props.level"
              :disabled="props.disabled"
              class="p-2 border cursor-grab bg-primary-foreground data-[is-dragging-me=true]:bg-accent data-[is-over=true]:bg-blue-300 transition-colors duration-300"
            >
              <template #default="{ isOver, isDraggingMe }">
                <div v-if="p.type === 'string'" class="">
                  {{ p.id }}
                </div>
                <TestGroup
                  v-else
                  :item="p"
                  :level="props.level + 1"
                  :disabled="isDraggingMe"
                  :layout-prefix="props.layoutPrefix"
                />
              </template>
            </Orderable>
          </template>

          <DropTarget
            v-else
            :accepted-types="[commonType]"
            :group="props.item.id"
            :index="props.item.content.length"
            :priority="props.level + 1"
          >
            <template #default="{ isOver }">
              <div :class="['h-10 border', isOver && 'bg-blue-300']" />
            </template>
          </DropTarget>
        </LayoutGroup>
      </div>
    </template>
    <template v-else>
      {{ props.item.id }}
    </template>
  </div>
</template>

<script setup lang="ts">
import DropTarget from '../DropTarget.vue';
import Orderable from '../Orderable.vue';
import type { Item } from './dataShape';
const commonType = 'test';

const props = defineProps<{
  item: Item;
  level: number;
  disabled?: boolean;
  layoutPrefix?: string;
}>();
</script>
