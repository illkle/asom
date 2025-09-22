<template>
  <ListView
    v-if="schema.data.value && viewSettings.q.data.value"
    v-bind="$attrs"
    :opened="opened"
    :view-settings="viewSettings.q.data.value"
    :schema="schema.data"
    @update:viewSettings:p="(v) => viewSettings.partialUpdater(v)"
  />
  <div v-else class="h-full w-full bg-background"></div>
</template>

<script setup lang="ts">
import type { IOpened } from '~/composables/stores/useTabsStoreV2';
import ListView from './ListView.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const schemaPath = computed(() => props.opened._path);
const schema = useSchemaByPath(schemaPath);

const schemaOwnerFolder = computed(() => schema.data.value?.owner_folder ?? '');

const viewSettings = useViewSettings(schemaOwnerFolder);
</script>
