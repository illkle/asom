<template>
  <DynamicViewDynamicConfiguration
    :layout="dataRefs.rootGroup"
    :availableItems="dataRefs.availableItems"
  >
    <template #item="{ item }">
      <div class="pointer-events-none p-1">
        {{ item }}
      </div>
    </template>
  </DynamicViewDynamicConfiguration>

  {{ dataRefs.rootGroup }}
</template>

<script setup lang="ts">
import { getFlatItems, type IDynamicViewGroup } from '~/components/DynamicView/helpers';

const rootGroup: Ref<IDynamicViewGroup> = ref({
  id: 'root',
  type: 'group',
  style: {
    direction: 'row',
    gap: '16',
    align: 'start',
    justify: 'between',
  },
  content: [
    {
      id: 'left',
      type: 'group',
      style: {
        direction: 'column',
        gap: '4',
        align: 'center',
        justify: 'start',
      },
      content: [
        {
          id: 'cover',
          type: 'item',
        },
        { id: 'myRating', type: 'item' },
      ],
    },
    {
      id: 'right',
      type: 'group',
      style: {
        direction: 'column',
        gap: '8',
        align: 'start',
        justify: 'start',
      },
      content: [
        { id: 'title', type: 'item' },
        { id: 'author', type: 'item' },
        {
          id: 'subline',
          type: 'group',
          style: {
            direction: 'row',
            gap: '16',
            align: 'center',
            justify: 'start',
          },
          content: [
            { id: 'year', type: 'item' },
            { id: 'ISBN13', type: 'item' },
          ],
        },
        { id: 'tags', type: 'item' },
        { id: 'read', type: 'item' },
      ],
    },
  ],
});

const flatItems = computed(() => {
  return new Set(getFlatItems(rootGroup.value).map((v) => v.id));
});
const base: { id: string; type: 'item' }[] = [
  { id: 'cover', type: 'item' },
  { id: 'myRating', type: 'item' },
  { id: 'title', type: 'item' },
  { id: 'author', type: 'item' },
  { id: 'year', type: 'item' },
  { id: 'ISBN13', type: 'item' },
  { id: 'tags', type: 'item' },
];

const availableItems = computed<{ id: string; type: 'item' }[]>({
  get() {
    return base.filter((v) => !flatItems.value.has(v.id));
  },
  set(value: { id: string; type: 'item' }[]) {},
});

const dataRefs = {
  rootGroup,
  availableItems,
};
</script>
