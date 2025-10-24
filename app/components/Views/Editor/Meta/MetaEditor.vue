<template>
  <div class="" :class="$attrs.class" id="attributesContainer">
    <div v-if="viewLayout.content.length === 0" class="mx-auto mb-8 mt-4 w-fit flex flex-col gap-2">
      <div class="text-sm text-muted-foreground">All schema items are hidden in current layout</div>

      <Button variant="outline" @click="emit('openEditMode')">Edit layout</Button>
    </div>

    <RenderDynamic v-else :group="viewLayout">
      <template #default="{ data }">
        <AttributesRouter
          v-if="attributesByKey?.[data.id]"
          v-model:model-value="openedFile.attrs[data.id]"
          :schema-item="attributesByKey[data.id]!"
          :hide-label="hideLabels"
        />
      </template>
    </RenderDynamic>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import { type IDynamicViewGroup } from '~/components/Modules/DynamicView/helpers';
import RenderDynamic from '~/components/Modules/DynamicView/RenderDynamic.vue';
import type { RecordFromDb, Schema, SchemaItem } from '~/types';
import AttributesRouter from './AttributesRouter.vue';
const p = defineProps({
  schema: {
    type: Object as PropType<Schema | null>,
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

const openedFile = defineModel<RecordFromDb>('openedFile', {
  required: true,
});

const attributesByKey = computed(() => {
  return p.schema?.items.reduce((acc: Record<string, SchemaItem>, attr) => {
    acc[attr.name] = attr;
    return acc;
  }, {});
});

const emit = defineEmits<{
  (e: 'openEditMode'): void;
}>();
</script>

<style scoped></style>
