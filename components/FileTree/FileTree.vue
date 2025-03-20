<template>
  <FileTreeInner v-for="folder in transformed" :content="folder" />
</template>

<script lang="ts" setup>
import { throttle } from 'lodash';
import { c_get_all_folders_by_schema } from '~/api/tauriActions';
import { useMainStore } from '~/composables/stores/useMainStore';
import { useListenToEvent } from '~/composables/useListenToEvent';
import FileTreeInner from './FileTreeInner.vue';
import { filePathsToTree } from './filePathsToTree';

const props = defineProps<{
  schemaPath: string;
  schemaName: string;
}>();

const { data, refetch, status } = useQuery({
  key: () => ['folders', props.schemaPath],
  query: async () => await c_get_all_folders_by_schema(props.schemaPath),
});

const store = useMainStore();

const transformed = computed(() =>
  !data.value || 'isError' in data.value ? [] : filePathsToTree(data.value),
);

const throttledRefresh = throttle(refetch, 1000, {
  leading: true,
});

useListenToEvent('FolderAdd', (v) => {
  throttledRefresh();
});
useListenToEvent('FolderRemove', (v) => {
  throttledRefresh();
});
</script>
