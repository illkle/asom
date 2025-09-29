<template>
  <TreeRoot
    :model-value="openedItem"
    v-if="!query.isPending.value"
    v-slot="{ flattenItems }"
    :items="foldersAsTree ?? []"
    :default-expanded="allFolderIds"
    :multiple="false"
    :get-key="(opt) => opt.rawPath"
    class="flex flex-col gap-0.5"
  >
    <template v-for="item in flattenItems" :key="item._id">
      <FolderNodeSidebar :item="item" />
    </template>
  </TreeRoot>
</template>

<script lang="ts" setup>
import { TreeRoot } from 'reka-ui';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import FolderNodeSidebar from './FolderNodeSidebar.vue';
import type { FolderNode } from './filePathsToTree';

const props = defineProps<{
  schemaPath: string;
  schemaName: string;
}>();

const selectedFolder = ref<FolderNode | undefined>(undefined);

const s = useTabsStoreV2();

const openedItem = computed(() =>
  s.openedItem && s.openedItem._type === 'folder' ? { rawPath: s.openedItem._path } : undefined,
);

const handler = useFolderInvalidator();

const { foldersAsTree, query } = useFoldersBySchema(props.schemaPath);
const allFolderIds = computed(() => {
  return query.data.value?.folders.map((v) => v.path) ?? [];
});
</script>
