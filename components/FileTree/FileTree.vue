<template>
  <FileTreeInner v-for="folder in transformed" :content="folder" />
</template>

<script lang="ts" setup>
import FileTreeInner from './FileTreeInner.vue';
import { filePathsToTree } from './filePathsToTree';
import { useListenToEvent } from '~/api/tauriEvents';
import { throttle } from 'lodash';
import { c_get_all_folders } from '~/api/tauriActions';

const { data, refetch, status } = useQuery({
  key: () => ['folders'],
  query: async () => await c_get_all_folders(),
});

watch(
  data,
  () => {
    console.log('data', data.value);
  },
  {
    deep: true,
  },
);

const store = useStore();

const transformed = computed(() =>
  !data.value || 'isError' in data.value ? [] : filePathsToTree(data.value, store.rootPath || ''),
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
