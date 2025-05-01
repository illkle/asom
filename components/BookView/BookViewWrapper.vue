<template>
  <BookViewBooksView
    v-if="schema.data.value && viewSettingsQ.data.value"
    :opened="opened"
    :view-settings="viewSettingsQ.data"
    :schema="schema.data"
    @update:view-settings="viewSettingsUpdater"
  />
  <div v-else class="h-46 w-46 bg-red-500"></div>
</template>

<script setup lang="ts">
import type { IOpenedPath } from '~/composables/stores/useTabsStoreV2';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedPath>,
    required: true,
  },
});

const schemaPath = computed(() => props.opened._path);
const schema = useSchemaByPath(schemaPath);

const schemaOwnerFolder = computed(() => schema.data.value?.owner_folder ?? '');

const { q: viewSettingsQ, viewSettingsUpdater } = useViewSettings(schemaOwnerFolder);
</script>
