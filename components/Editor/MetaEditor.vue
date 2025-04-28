<template>
  <div class="grid gap-2" :class="$attrs.class" id="attributesContainer">
    <template v-if="editMode">
      <DynamicViewDynamicConfiguration
        v-if="schema"
        :layout="viewLayout"
        :schema="schema"
        @update:layout="(v) => emit('update:layout', v)"
        @discard="
          () => {
            emit('discard');
          }
        "
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

    <DynamicViewRenderDynamic v-else :group="viewLayout">
      <template #default="{ data }">
        <EditorAttributesRouter
          v-if="attributesByKey?.[data.id]"
          v-model:model-value="openedFile.attrs[data.id]"
          :schema-item="attributesByKey[data.id]"
          :hide-label="hideLabels"
        />
      </template>
    </DynamicViewRenderDynamic>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import type { RecordFromDb, Schema, SchemaItem } from '~/types';
import { type IDynamicViewGroup } from '../DynamicView/helpers';
const p = defineProps({
  schema: {
    type: Object as PropType<Schema | null>,
  },
  editMode: {
    type: Boolean,
    default: false,
  },
  viewLayout: {
    type: Object as PropType<IDynamicViewGroup>,
    required: true,
  },
  hideLabels: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'update:layout', layout: IDynamicViewGroup): void;
  (e: 'discard'): void;
}>();

const openedFile = defineModel<RecordFromDb>('openedFile', {
  required: true,
});

const attributesByKey = computed(() => {
  return p.schema?.items.reduce((acc: Record<string, SchemaItem>, attr) => {
    acc[attr.name] = attr;
    return acc;
  }, {});
});

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
