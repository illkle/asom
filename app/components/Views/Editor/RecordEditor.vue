<template>
  <div
    ref="scrollElement"
    class="h-full flex flex-col w-full pb-4 bg-background overflow-y-auto scrollbarMod gutter-stable px-4"
  >
    <LoaderForPage v-if="fileEditor.somethingPending.value" />
    <div v-else class="max-w-3xl mx-auto w-full">
      <FileControls
        v-if="fileEditor.editableProxy.value"
        :opened="opened"
        :file-editor="fileEditor"
      />

      <LayoutWarning
        v-if="fileEditor.editableProxy.value"
        :file-editor="fileEditor"
        @open-edit-mode="openEditMode"
      />

      <MetaEditor
        v-if="fileEditor.editableProxy.value && schema && fileEditor.viewLayoutQ.data.value"
        v-model:opened-file="fileEditor.editableProxy.value.record.record"
        :view-layout="fileEditor.viewLayoutQ.data.value"
        :hide-labels="fileEditor.viewSettingsQ.data.value?.labelsHidden"
        :schema="schema.schema"
        @open-edit-mode="openEditMode"
        class="py-2"
      />

      <EditorCommands :file-editor="fileEditor" class="mt-2 sticky top-11" />

      <div ref="editorWrapper" class="grow min-h-64 flex items-stretch"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { path } from '@tauri-apps/api';
import { computedAsync } from '@vueuse/core';
import LoaderForPage from '~/components/Modules/LoaderForPage.vue';
import {
  useScrollRestorationOnMount,
  useScrollWatcher,
  useTabsStoreV2,
  useUpdateCurrentTabTitleFrom,
  type IOpened,
} from '~/composables/stores/useTabsStoreV2';
import MetaEditor from './Meta/MetaEditor.vue';
import FileControls from './FileControls.vue';
import LayoutWarning from './LayoutWarning.vue';
import EditorCommands from '~/components/Views/Editor/EditorCommands.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const title = computedAsync(async () => {
  return await path.basename(props.opened._path, '.md');
});

useUpdateCurrentTabTitleFrom({
  target: title,
});

const editorWrapper = useTemplateRef('editorWrapper');

const fileEditor = useFileEditorV2(props.opened, editorWrapper);

const schema = computed(() => fileEditor.fileQ.data.value?.record.schema);

const scrollElement = useTemplateRef('scrollElement');
useScrollWatcher(scrollElement);
useScrollRestorationOnMount(
  scrollElement,
  computed(() => !!fileEditor.fileQ.data.value),
);

const ts = useTabsStoreV2();

const openEditMode = () => {
  if (!schema.value?.location.schema_owner_folder) return;
  ts.openNewThingFast(
    { _type: 'settings/layout', _path: schema.value.location.schema_owner_folder },
    'last',
  );
};
</script>

<style>
.customTopGrid {
  grid-template-columns: minmax(min-content, max-content) 3fr 1fr;
}
</style>
