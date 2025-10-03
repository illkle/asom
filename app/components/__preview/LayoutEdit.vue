<template>
  <div class="max-h-[300px] overflow-y-auto scrollbarMod">
    <div v-if="editableProxy && schema && layout" class="max-w-3xl">
      <DynamicConfiguration
        v-if="schema"
        :layout="layout"
        @update:layout="(v) => (layout = v)"
        :schema="schema"
      >
        <template #item="{ item }">
          <div class="pointer-events-none">
            <AttributesRouter
              v-if="attributesByKey?.[item.id]"
              v-model:model-value="editableProxy.attrs[item.id]"
              :schema-item="attributesByKey?.[item.id]!"
              :disabled="true"
            />
          </div>
        </template>
      </DynamicConfiguration>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es';
import DynamicConfiguration from '~/components/Modules/DynamicView/DynamicConfiguration.vue';
import AttributesRouter from '~/components/Views/Editor/AttributesRouter.vue';
import { ROOT_PATH_PROVIDE } from '~/composables/data/providers';
import type { AttrValue, RecordFromDb, SchemaItem } from '~/types';
import { getValByType } from '../Views/Schema/mocks';

provide(ROOT_PATH_PROVIDE, ref('preview'));
provide('PREVIEW_MODE', true);
const ppp = cloneDeep(DefaultSchemaPacks[0]!);

const schema = ref(ppp.schema);
const layout = ref(ppp.view);

const editableProxy = ref<RecordFromDb>({
  path: null,
  modified: 0,
  markdown: 'null',
  attrs: {},
});

const attributesByKey = computed(() => {
  return schema.value?.items.reduce((acc: Record<string, SchemaItem>, attr) => {
    acc[attr.name] = attr;
    return acc;
  }, {});
});

watch(
  computed(() => schema.value),
  (v) => {
    if (v) {
      const att: Record<string, AttrValue> = {};

      v.items.forEach((item) => {
        att[item.name] = getValByType(item.value.type);
      });

      editableProxy.value.attrs = att;
    }
  },
  { deep: true, immediate: true },
);
</script>
