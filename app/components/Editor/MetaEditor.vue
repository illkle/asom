<template>
  <div class="" :class="$attrs.class" id="attributesContainer">
    <template v-if="editMode">
      <DynamicConfiguration
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
            <AttributesRouter
              v-if="attributesByKey?.[item.id]"
              v-model:model-value="openedFile.attrs[item.id]"
              :schema-item="attributesByKey[item.id]"
              :disabled="true"
            />
          </div>
        </template>
      </DynamicConfiguration>
    </template>

    <div
      v-else-if="viewLayout.content.length === 0 && !editMode"
      class="mx-auto mb-8 mt-4 w-fit flex flex-col gap-2"
    >
      <div class="text-sm text-muted-foreground">All schema items are hidden in current layout</div>

      <Button variant="outline" @click="emit('editMode')">Edit layout</Button>
    </div>

    <RenderDynamic v-else :group="viewLayout">
      <template #default="{ data }">
        <AttributesRouter
          v-if="attributesByKey?.[data.id]"
          v-model:model-value="openedFile.attrs[data.id]"
          :schema-item="attributesByKey[data.id]"
          :hide-label="hideLabels"
        />
      </template>
    </RenderDynamic>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import type { RecordFromDb, Schema, SchemaItem } from '~/types';
import DynamicConfiguration from '../DynamicView/DynamicConfiguration.vue';
import { type IDynamicViewGroup } from '../DynamicView/helpers';
import RenderDynamic from '../DynamicView/RenderDynamic.vue';
import AttributesRouter from './AttributesRouter.vue';
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
  (e: 'editMode'): void;
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
