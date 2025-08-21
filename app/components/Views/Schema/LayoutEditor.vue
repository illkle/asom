<template>
  <PageTemplate :data-pending="!viewLayoutEditableData || viewSettingsQ.isPending.value">
    <template #title> Layout editor </template>

    <div v-if="editableProxy && schema.data.value && viewLayoutEditableData">
      <DynamicConfiguration
        v-if="schema"
        :layout="viewLayoutEditableData"
        :schema="schema.data.value.schema"
      >
        <template #item="{ item }">
          <div class="pointer-events-none p-1">
            <AttributesRouter
              v-if="attributesByKey?.[item.id]"
              v-model:model-value="editableProxy.attrs[item.id]"
              :schema-item="attributesByKey[item.id]"
              :disabled="true"
            />
          </div>
        </template>
      </DynamicConfiguration>
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import DynamicConfiguration from '~/components/Modules/DynamicView/DynamicConfiguration.vue';
import AttributesRouter from '~/components/Views/Editor/AttributesRouter.vue';
import { useTabsStoreV2, type IOpened } from '~/composables/stores/useTabsStoreV2';
import type { AttrValue, RecordFromDb, SchemaItem } from '~/types';
import { getValByType } from './mocks';
import PageTemplate from './PageTemplate.vue';

const tabsStore = useTabsStoreV2();

const editableProxy = ref<RecordFromDb>({
  path: null,
  modified: null,
  markdown: 'null',
  attrs: {},
});

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const schema = useSchemaByPath(computed(() => props.opened._path));

const ownerFolder = computed(() => schema.data.value?.owner_folder ?? '');

const viewLayoutEditableData = useViewLayoutEditable(ownerFolder);

const { q: viewSettingsQ } = useViewSettings(ownerFolder);

const attributesByKey = computed(() => {
  return schema.data.value?.schema.items.reduce((acc: Record<string, SchemaItem>, attr) => {
    acc[attr.name] = attr;
    return acc;
  }, {});
});

watch(
  computed(() => schema.data.value),
  (v) => {
    if (v) {
      const att: Record<string, AttrValue> = {};

      v.schema.items.forEach((item) => {
        att[item.name] = getValByType(item.value.type);
      });

      editableProxy.value.attrs = att;
    }
  },
  { deep: true, immediate: true },
);
</script>
