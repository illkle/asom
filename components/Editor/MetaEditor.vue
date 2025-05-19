<template>
  <div class="" :class="$attrs.class" id="attributesContainer">
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
</script>

<style scoped></style>
