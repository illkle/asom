<template>
  <LoaderForPage
    v-if="files.files.isPending.value || schema.isPending.value || viewSettings.q.isPending.value"
  />
  <PageError
    v-else-if="files.files.error.value || schema.error.value || viewSettings.q.error.value"
  />
  <ListView
    v-else
    v-bind="$attrs"
    :opened="opened"
    :files="files"
    :view-settings="viewSettings.q.data.value"
    :schema="schema.data"
    @update:viewSettings:p="(v) => viewSettings.partialUpdater(v)"
  />
</template>

<script setup lang="ts">
import { path } from '@tauri-apps/api';
import { computedAsync } from '@vueuse/core';
import LoaderForPage from '~/components/Modules/LoaderForPage.vue';
import PageError from '~/components/Modules/PageError.vue';
import { useFilesListV2 } from '~/components/Views/List/useFileList';
import { useUpdateCurrentTabTitleFrom, type IOpened } from '~/composables/stores/useTabsStoreV2';
import ListView from './ListView.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const files = useFilesListV2({
  opened: props.opened,
});

const schemaPath = computed(() => props.opened._path);
const schema = useSchemaByPath(schemaPath);

const schemaOwnerFolder = computed(() => schema.data.value?.location.schema_owner_folder ?? '');

const viewSettings = useViewSettings(schemaOwnerFolder);
const title = computedAsync(async () => {
  return await path.basename(schemaPath.value);
});

useUpdateCurrentTabTitleFrom({
  target: title,
});
</script>
