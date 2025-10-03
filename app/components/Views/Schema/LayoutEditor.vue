<template>
  <PageTemplate
    :data-pending="!viewLayoutData.q.data.value || viewSettingsQ.isPending.value"
    tab-title="Layout editor"
  >
    <template #title> Layout editor </template>
    <template #title-badge>
      <TitleSchemaBadge :schema="schema.data.value?.schema" />
    </template>

    <div v-if="editableProxy && schema.data.value && viewLayoutData.q.data.value">
      <DynamicConfiguration
        v-if="schema"
        :layout="viewLayoutData.q.data.value"
        @update:layout="(v) => viewLayoutData.m.mutate(v)"
        :schema="schema.data.value.schema"
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
  </PageTemplate>
</template>

<script setup lang="ts">
import DynamicConfiguration from '~/components/Modules/DynamicView/DynamicConfiguration.vue';
import AttributesRouter from '~/components/Views/Editor/AttributesRouter.vue';
import { useTabsStoreV2, type IOpened } from '~/composables/stores/useTabsStoreV2';
import type { AttrValue, RecordFromDb, SchemaItem } from '~/types';
import PageTemplate from './common/PageTemplate.vue';
import TitleSchemaBadge from './common/TitleSchemaBadge.vue';
import { getValByType } from './mocks';

const tabsStore = useTabsStoreV2();

const editableProxy = ref<RecordFromDb>({
  path: null,
  modified: 0,
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

const ownerFolder = computed(() => schema.data.value?.location.schema_owner_folder ?? '');

const viewLayoutData = useViewLayout(ownerFolder);

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
