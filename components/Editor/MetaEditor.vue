<template>
  <div class="grid gap-2" :class="$attrs.class" id="attributesContainer">
    <template v-if="false" v-for="item in schema?.items">
      <div :id="item.name" class="flex">
        <EditorAttributesRouter
          v-model:model-value="openedFile.attrs[item.name]"
          :schema-item="item"
        />
      </div>
    </template>

    <DynamicViewRenderDynamic :group="rootGroup">
      <template #default="{ data }">
        <EditorAttributesRouter
          v-if="attributesByKey?.[data]"
          v-model:model-value="openedFile.attrs[data]"
          :schema-item="attributesByKey[data]"
        />
      </template>
    </DynamicViewRenderDynamic>
  </div>

  <div ref="forDrag" class="absolute top-[-500px]">
    <UiExtraDragDisplay> dragging </UiExtraDragDisplay>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import type { RecordFromDb, Schema, SchemaItem } from '~/types';
import type { IDynamicViewGroup } from '../DynamicView/helpers';
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

const rootGroup: IDynamicViewGroup = {
  name: 'root',
  style: {
    direction: 'row',
    gap: 16,
    align: 'start',
    justify: 'between',
  },
  subcategories: [
    {
      name: 'left',
      style: {
        direction: 'column',
        gap: 4,
        align: 'center',
        justify: 'start',
      },
      subcategories: ['cover', 'myRating'],
    },
    {
      name: 'right',
      style: {
        direction: 'column',
        gap: 8,
        align: 'start',
        justify: 'start',
      },
      subcategories: [
        'title',
        'author',
        {
          name: 'subline',
          style: {
            direction: 'row',
            gap: 16,
            align: 'center',
            justify: 'start',
          },
          subcategories: ['year', 'ISBN13'],
        },

        'tags',
        'read',
      ],
    },
  ],
};

/*
///
/// Cover Right click
///
const removeCoverHandler = async () => {
  if ('unsaved' in openedFile.value) return;
  removeCover({ bookFilePath: openedFile.value.path });
};

const setCoverHandle = () => {
  if ('unsaved' in openedFile.value) return;
  setCover({ bookFilePath: openedFile.value.path });
};

const fetchCoverHandle = async () => {
  if (!openedFile.value.ISBN13) {
    toast.error("Can't fetch cover without isbn13", {
      description: 'Please specify ISBN and try again',
    });
    return;
  }

  if ('unsaved' in openedFile.value) {
    toast.error(`Can't fetch cover for unsaved file`, {
      description: 'Save file and try again',
    });
    return;
  }

  const promise = fetchCover({ bookFilePath: openedFile.value.path });

  toast.promise(promise, {
    loading: 'Fetching...',
    success: () => {
      return `Cover updated`;
    },
    error: (e: any) => {
      return String(e);
    },
  });
};

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
