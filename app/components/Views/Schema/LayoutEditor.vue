<template>
  <PageTemplate :data-pending="viewLayoutQ.isPending.value || viewSettingsQ.isPending.value">
    <div class="flex items-center justify-between">
      <h1 class="mb-4 font-serif text-3xl">Layout editor</h1>
    </div>

    <div class="flex flex-col gap-2 text-sm text-muted-foreground">
      It's easier to edit layout on an existing file, because some properties(notably "Size Units")
      are not reflected in layout editor
    </div>

    <div v-if="editableProxy && schema.data.value && viewLayoutQ.data.value">
      <MetaEditor
        v-model:opened-file="editableProxy"
        :view-layout="viewLayoutQ.data.value"
        :hide-labels="viewSettingsQ.data.value?.labelsHidden"
        @update:layout="
          (v) => {
            updateViewLayout(v);
            tabsStore.moveBack();
          }
        "
        @discard="
          () => {
            tabsStore.moveBack();
          }
        "
        :edit-mode="true"
        :schema="schema.data.value.schema"
        class="py-2"
      />
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import MetaEditor from '~/components/Views/Editor/MetaEditor.vue';
import { useTabsStoreV2, type IOpened } from '~/composables/stores/useTabsStoreV2';
import type { AttrValue, RecordFromDb } from '~/types';
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

const { q: viewLayoutQ, update: updateViewLayout } = useViewLayout(ownerFolder);

const { q: viewSettingsQ } = useViewSettings(ownerFolder);

watch(
  computed(() => schema.data.value),
  (v) => {
    console.log('v', v);
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
