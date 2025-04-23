<template>
  <div>
    <template v-if="props.item.type === 'group'">
      <div class="flex justify-end items-center px-2">
        <Button
          variant="ghost"
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
            <Button variant="ghost" @click.stop @pointerdown.stop>
              <CogIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DynamicViewDropdownConfigMenu v-model="props.item.style" />
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" @click.stop="emit('delete', props.item.id)" @pointerdown.stop>
          <TrashIcon />
        </Button>
      </div>

      <div :style="getStyle(props.item)" class="p-2">
        <LayoutGroup>
          <template v-if="props.item.content.length">
            <NestedDragOrderable
              v-for="(p, index) in props.item.content"
              :key="p.id"
              :group="props.item.id"
              :id="p.id"
              :type="commonType"
              :index="index"
              :priority="props.level"
              :disabled="props.disabled"
              class="border rounded-md cursor-grab bg-background data-[is-dragging-me=true]:bg-muted data-[is-over=true]:bg-accent transition-colors duration-300"
            >
              <template #default="{ isOver, isDraggingMe }">
                <slot v-if="p.type === 'item'" name="item" :item="p" />

                <RenderDynamicEditor
                  v-else
                  :item="p"
                  :level="props.level + 1"
                  :disabled="isDraggingMe"
                  @delete="(id) => emit('delete', id)"
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
            :accepted-types="[commonType]"
            :group="props.item.id"
            :index="props.item.content.length"
            :priority="props.level + 1"
            :class="'w-full data-[is-dragging-me=true]:bg-muted data-[is-over=true]:bg-accent transition-colors duration-300 h-10 border'"
          >
            <template #default="{ isOver }"> </template>
          </NestedDragDropTarget>
        </LayoutGroup>
      </div>
    </template>
    <template v-else>
      <slot name="item" :item="props.item" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { CogIcon, SquarePlus, TrashIcon } from 'lucide-vue-next';
import type { IDynamicItem } from './helpers';
import { getStyle } from './helpers';
const commonType = 'test';

const props = defineProps<{
  item: IDynamicItem;
  level: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();
</script>
