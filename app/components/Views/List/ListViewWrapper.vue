<template>
  <BooksView
    v-if="schema.data.value && viewSettingsQ.data"
    v-bind="$attrs"
    :opened="opened"
    :view-settings="viewSettingsQ.data"
    :schema="schema.data"
    @update:view-settings="viewSettingsUpdater"
  />
</template>

<script setup lang="ts">
import type { IOpened } from '~/composables/stores/useTabsStoreV2';
import BooksView from './ListView.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const schemaPath = computed(() => props.opened._path);
const schema = useSchemaByPath(schemaPath);

const schemaOwnerFolder = computed(() => schema.data.value?.owner_folder ?? '');

const { q: viewSettingsQ, viewSettingsUpdater } = useViewSettings(schemaOwnerFolder);
</script>
