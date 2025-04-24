<template>
  <motion.div layout class="">
    <template v-if="props.item.type === 'group'">
      <!-- Top Menu-->
      <motion.div layout="preserve-aspect" class="flex justify-between items-center pl-2 border-b">
        <motion.div layout="preserve-aspect" class="text-xs text-muted-foreground"
          >Group</motion.div
        >
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
                    style: { direction: 'row', gap: '16', align: 'start', justify: 'start' },
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
                class="rounded-none border-0 border-r"
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
          <Button
            size="sm"
            variant="outline"
            class="rounded-none border-0"
            @click.stop="emit('delete', props.item.id)"
            @pointerdown.stop
          >
            <TrashIcon />
          </Button>
        </motion.div>
      </motion.div>
      <!-- Content-->
      <div :style="getStyle(props.item)" class="p-2">
        <template v-if="props.item.content.length">
          <NestedDragOrderable2
            v-for="(p, index) in props.item.content"
            :key="p.id"
            :group="props.item.id"
            :id="p.id"
            :type="commonType"
            :index="index"
            :priority="props.level"
            :disabled="props.disabled"
            :location="[...props.location, p.id]"
            :class="[p.type === 'item' ? '' : 'border', 'rounded-md data-[is-over=true]:bg-accent']"
            :drag-class="[
              'rounded-md cursor-grab data-[is-dragging-me=true]:bg-background/30 data-[is-dragging-me=true]:border-muted-foreground  transition-colors duration-300',
              p.type === 'item' ? '' : 'border',
            ]"
          >
            <template #default="{ isDraggingMe }">
              <slot v-if="p.type === 'item'" name="item" :item="p" />

              <RenderDynamicEditor
                v-else
                :item="p"
                :level="props.level + 1"
                :disabled="isDraggingMe"
                :location="[...props.location, p.id]"
                @delete="(id) => emit('delete', id)"
              >
                <!-- @vue-expect-error This is correct, but ts is stuck because recursive type -->
                <template #item="{ item }">
                  <slot name="item" :item="item" />
                </template>
              </RenderDynamicEditor>
            </template>
          </NestedDragOrderable2>
        </template>

        <NestedDragDropTarget
          v-else
          :accepted-types="[commonType]"
          :group="props.item.id"
          :index="props.item.content.length"
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
import { CogIcon, SquarePlus, TrashIcon } from 'lucide-vue-next';
import { motion } from 'motion-v';
import type { IDynamicItem } from './helpers';
import { getStyle } from './helpers';

const commonType = 'test';

const props = defineProps<{
  item: IDynamicItem;
  level: number;
  disabled?: boolean;
  location: string[];
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();
</script>
