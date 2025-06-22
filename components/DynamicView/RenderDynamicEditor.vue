<template>
  <motion.div layout class="w-full">
    <template v-if="props.item.type === 'group'">
      <!-- Top Menu-->
      <motion.div layout class="flex justify-between items-center pl-2 border-b">
        <motion.div layout="preserve-aspect" class="text-xs text-muted-foreground"></motion.div>
        <motion.div layout="preserve-aspect" class="flex">
          <Button
            variant="outline"
            size="sm"
            class="rounded-none border-t-0 border-b-0"
            @click.stop="
              () => {
                if (props.item.type === 'group') {
                  props.item.content.push({
                    id: generateUniqId(),
                    type: 'group',
                    style: {
                      direction: 'column',
                      gap: '4',
                      align: 'start',
                      justify: 'start',
                      sizeUnits: '1',
                    },
                    content: [],
                  });
                }
              }
            "
            @pointerdown.stop
          >
            <SquarePlus />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                size="sm"
                variant="outline"
                class="rounded-none border-0 border-r-0 rounded-tr-md"
                @click.stop
                @pointerdown.stop
              >
                <CogIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DynamicViewDropdownConfigMenu v-model="props.item.style" />
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </motion.div>
      <!-- Content-->
      <div :style="getStyle(props.item)" class="p-2">
        <template v-if="props.item.content.length">
          <NestedDragOrderable
            v-for="(p, index) in props.item.content"
            :key="p.id"
            :group="props.item.id"
            :id="p.id"
            :type="commonType"
            :priority="props.level"
            :disabled="props.disabled"
            :parentIds="[...props.parentIds]"
            :class="[p.type === 'item' ? '' : '', 'rounded-md w-full']"
            :drag-class="[
              'data-[is-dragging-me=true]:bg-background/50',
              'rounded-md cursor-grab data-[is-dragging-me=true]:border-muted-foreground transition-colors duration-300',
              p.type === 'item' ? '' : 'border',
            ]"
          >
            <template #default="{ isDraggingMe, isOver, quadrant }">
              <template v-if="isOver && !isDraggingMe">
                <motion.div
                  v-if="props.item.style.direction === 'column'"
                  :key="quadrant?.y"
                  class="absolute w-full h-0.5 bg-accent-foreground rounded-full"
                  :class="[quadrant?.y === 'top' ? '-top-1' : '-bottom-1']"
                  :initial="{ opacity: 0 }"
                  :animate="{ opacity: 1 }"
                  :exit="{ opacity: 0 }"
                ></motion.div>
                <motion.div
                  v-if="props.item.style.direction === 'row'"
                  :key="quadrant?.x"
                  :initial="{ opacity: 0 }"
                  :animate="{ opacity: 1 }"
                  :exit="{ opacity: 0 }"
                  class="absolute top-0 w-0.5 h-full bg-accent-foreground rounded-full"
                  :class="[quadrant?.x === 'left' ? '-left-1 ' : '-right-1 ']"
                ></motion.div>
              </template>

              <slot v-if="p.type === 'item'" name="item" :item="p" />

              <RenderDynamicEditor
                v-else
                :item="p"
                :level="props.level + 1"
                :disabled="isDraggingMe"
                :parentIds="[...props.parentIds, p.id]"
                @delete="(v) => emit('delete', v)"
              >
                <!-- @vue-expect-error This is correct, but ts is stuck because recursive type -->
                <template #item="{ item }">
                  <slot name="item" :item="item" />
                </template>
              </RenderDynamicEditor>
            </template>
          </NestedDragOrderable>
        </template>

        <NestedDragDropTarget
          v-else
          :id="props.item.id + '-first-item'"
          :index="props.item.content.length"
          :parentIds="props.parentIds"
          :priority="props.level + 1"
          :class="'w-full data-[is-dragging-me=true]:bg-muted data-[is-over=true]:bg-accent transition-colors duration-300 h-10'"
        >
          <template #default="{ isOver }"> </template>
        </NestedDragDropTarget>
      </div>
    </template>
    <template v-else>
      <slot name="item" :item="props.item" />
    </template>
  </motion.div>
</template>

<script setup lang="ts">
import { CogIcon, SquarePlus } from 'lucide-vue-next';
import { motion } from 'motion-v';
import type { ItemInfoCore } from '~/components/NestedDrag/common';
import type { IDynamicItem } from './helpers';
import { getStyle } from './helpers';

const commonType = 'test';

const props = defineProps<{
  item: IDynamicItem;
  level: number;
  disabled?: boolean;
  parentIds: ItemInfoCore['parentIds'];
}>();

const emit = defineEmits<{
  (e: 'delete', id: ItemInfoCore): void;
}>();
</script>
