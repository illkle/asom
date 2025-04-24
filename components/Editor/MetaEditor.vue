<template>
  <div class="grid gap-2" :class="$attrs.class" id="attributesContainer">
    <Button variant="ghost" @click="editMode = !editMode">
      {{ editMode ? 'View' : 'Edit' }}
    </Button>

    <template v-if="editMode">
      <DynamicViewDynamicConfiguration
        :available-items="dataRefs.availableItems"
        :layout="dataRefs.rootGroup"
      >
        <template #item="{ item }">
          <div class="pointer-events-none p-1">
            <EditorAttributesRouter
              v-if="attributesByKey?.[item.id]"
              v-model:model-value="openedFile.attrs[item.id]"
              :schema-item="attributesByKey[item.id]"
              :disabled="true"
            />
          </div>
        </template>
      </DynamicViewDynamicConfiguration>
    </template>

    <DynamicViewRenderDynamic v-else :group="rootGroup">
      <template #default="{ data }">
        <EditorAttributesRouter
          v-if="attributesByKey?.[data.id]"
          v-model:model-value="openedFile.attrs[data.id]"
          :schema-item="attributesByKey[data.id]"
        />
      </template>
    </DynamicViewRenderDynamic>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import type { RecordFromDb, Schema, SchemaItem } from '~/types';
import { getFlatItems, type IDynamicViewGroup, type ILayoutItem } from '../DynamicView/helpers';
const p = defineProps({
  schema: {
    type: Object as PropType<Schema | null>,
  },
});

const openedFile = defineModel<RecordFromDb>({
  required: true,
});

const attributesByKey = computed(() => {
  return p.schema?.items.reduce((acc: Record<string, SchemaItem>, attr) => {
    acc[attr.name] = attr;
    return acc;
  }, {});
});

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

const availableItems = computed<{ id: string; type: 'item' }[]>({
  get() {
    const i =
      p.schema?.items
        .filter((v) => !flatItems.value.has(v.name))
        .map((attr) => ({
          id: attr.name,
          type: 'item',
        })) || [];

    return i as ILayoutItem[];
  },
  set(value: { id: string; type: 'item' }[]) {},
});

const dataRefs = {
  rootGroup,
  availableItems,
};

const editMode = ref(true);

/*
///
/// Cover Right click
///


const dragging = ref('');
const forDrag = ref();

const startDrag = (devt: DragEvent) => {

  if (
    devt.dataTransfer === null ||
    !openedFile.value ||
    'unsaved' in openedFile.value ||
    !openedFile.value.name
  ) {
    return;
  }

  devt.dataTransfer.setData('itemPath', openedFile.value.path);
  devt.dataTransfer.setDragImage(forDrag.value, 0, 0);
  dragging.value = openedFile.value.name;

  if (!store.openedTabs) return;
  const toUpdateIndexes = store.openedTabs.reduce((acc: number[], opened, index) => {
    if ('unsaved' in openedFile.value) return [];
    if (opened.type === 'file' && opened.thing === openedFile.value?.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));

};  */
</script>

<style scoped></style>
