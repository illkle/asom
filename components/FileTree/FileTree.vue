<template>
  <TreeRoot
    :model-value="openedItem"
    v-if="!query.isPending.value"
    v-slot="{ flattenItems }"
    :items="foldersAsTree?.[0]?.children || []"
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
import { useTabsStore } from '~/composables/stores/useTabsStore';
import FolderNodeSidebar from './FolderNodeSidebar.vue';
import type { FolderNode } from './filePathsToTree';

const props = defineProps<{
  schemaPath: string;
  schemaName: string;
}>();

const selectedFolder = ref<FolderNode | undefined>(undefined);

const s = useTabsStore();

const openedItem = computed(() =>
  s.openedItem && s.openedItem.type === 'folder' ? { rawPath: s.openedItem.thing } : undefined,
);

const handler = useFolderInvalidator();

const { foldersAsTree, query } = useFoldersBySchema(props.schemaPath);
const allFolderIds = computed(() => {
  return query.data.value?.folders.map((v) => v.path) ?? [];
});
</script>
