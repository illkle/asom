<template>
  <DynamicViewRenderDynamic :group="value" class="border rounded-md grow px-2 pb-2">
    <template #header="{ group }">
      <div
        class="border border-t-0 px-2 rounded-b-md"
        :class="{
          'bg-accent cursor-copy': dragging,
        }"
        @mouseenter="
          () => {
            target = group.name;
          }
        "
        @mouseleave="
          () => {
            target = null;
          }
        "
      >
        {{ group.name }}
      </div>
      <div class="h-4"></div>
    </template>
    <template #default="{ data, group, index }">
      <div class="border rounded-md">
        <span class="px-2">
          {{ data }}
        </span>

        <Button variant="ghost" @click="() => group.subcategories.splice(index, 1)">
          <XIcon :size="16" />
        </Button>
      </div>
    </template>
  </DynamicViewRenderDynamic>

  <div class="flex gap-2">
    <Button v-for="value in values" @mousedown="onDragStart(value)">
      <div>{{ value }}</div>
    </Button>
  </div>

  <Button
    @mousedown="
      onDragStart({
        name: generateUniqId(),
        subcategories: [],
        style: { direction: 'row', gap: 0, align: 'start', justify: 'start' },
      })
    "
  >
    Group
  </Button>

  {{ dragging }}

  {{ target }}

  {{ value }}

  {{ allGroups }}
</template>

<script setup lang="ts">
import { XIcon } from 'lucide-vue-next';
import { ref } from 'vue';
import type { IDynamicViewGroup } from './helpers';

const value = ref<IDynamicViewGroup>({
  name: 'root',
  style: { direction: 'row', gap: 0, align: 'start', justify: 'start' },
  subcategories: [
    {
      name: 'lol',
      style: { direction: 'row', gap: 0, align: 'start', justify: 'start' },
      subcategories: [],
    },
  ],
});

const allGroups = computed(() => {
  const q = [value.value];

  const g: Record<string, IDynamicViewGroup> = {};

  while (q.length > 0) {
    const group = q.shift();

    if (!group) return;

    g[group.name] = group;

    if (group?.subcategories) {
      q.push(...group.subcategories.filter((s) => typeof s === 'object'));
    }
  }

  return g;
});

type Item = string | IDynamicViewGroup;

const dragging = ref<Item | null>(null);

const values = ref<Item[]>(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);

const onDragStart = (item: Item) => {
  dragging.value = item;

  document.addEventListener('mouseup', onDragEnd);
};

const onDragEnd = () => {
  if (target.value && dragging.value && allGroups.value) {
    console.log(target.value, dragging.value);
    const group = allGroups.value[target.value];

    console.log(group);
    if (group) {
      group.subcategories.push(dragging.value);
    }
  }
  dragging.value = null;
};

const dragTarget = ref<HTMLElement | null>(null);

const target = ref<string | null>();
</script>
