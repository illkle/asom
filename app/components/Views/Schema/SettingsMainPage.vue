<template>
  <PageTemplate :data-pending="isPending" tab-title="Root path & Schema">
    <template #title> Root path & Schema </template>

    <div class="flex items-stretch justify-between">
      <div
        class="flex flex-col gap-1 border w-full p-2 rounded-md rounded-r-none rounded-b-none border-b-0"
      >
        <div class="font-mono text-xs opacity-30">Root path:</div>
        <div class="font-mono text-xs">
          {{ rootPath }}
        </div>
      </div>
      <Button
        variant="outline"
        size="none"
        class="px-3 border-l-0 rounded-l-none border-b-0 rounded-b-none"
        @click="changeRootPathHandler"
      >
        <FolderIcon :size="12" />
      </Button>
    </div>

    <div class="gap-4">
      <div>
        <div :class="cn('rounded-lg border px-4 py-6 rounded-t-none ')">
          <Button
            variant="outline"
            size="sm"
            class="bg-transparent w-full mb-2"
            @click="
              () => {
                folderCreationPath = rootPath ?? '';
                isNewFolderDialogOpen = true;
              }
            "
          >
            <PlusIcon :size="12" class="mr-2" />
            Create Folder
          </Button>

          <TreeRoot
            v-if="!isPending"
            v-slot="{ flattenItems }"
            :items="foldersAsTree ?? []"
            :default-expanded="allFolderIds"
            multiple
            :get-key="(opt) => opt.rawPath"
            class="flex flex-col gap-2"
          >
            <template v-for="item in flattenItems">
              <FolderNodeSchema
                :item="item"
                @add-new-schema="addNewSchema"
                @create-folder="(v) => ((isNewFolderDialogOpen = true), (folderCreationPath = v))"
                @edit-schema="
                  (v) => tabsStore.openNewThingFast({ _type: 'settings/schema', _path: v }, 'here')
                "
              />
            </template>
          </TreeRoot>
        </div>

        <div class="mt-4 text-xs text-muted-foreground">
          Right click to create or delete schema for a folder
        </div>
      </div>
    </div>

    <Dialog v-model:open="isNewFolderDialogOpen">
      <DialogContent>
        <DialogTitle>Create new folder</DialogTitle>
        <Button
          variant="outline"
          :disabled="true"
          size="sm"
          class="flex w-full justify-start gap-2"
        >
          <FolderIcon :size="12" />
          {{ folderWhereToCreateName }}
        </Button>
        <Input v-model="newFolderName" @keydown.enter="createNewFolder" />
        <Button :disabled="!newFolderName" @click="createNewFolder"> Create </Button>
      </DialogContent>
    </Dialog>
  </PageTemplate>
</template>

<script setup lang="ts">
import { useQueryCache } from '@pinia/colada';
import { TreeRoot } from 'reka-ui';
import { c_save_schema } from '~/api/tauriActions';

import { path } from '@tauri-apps/api';
import { mkdir } from '@tauri-apps/plugin-fs';
import { computedAsync } from '@vueuse/core';
import { FolderIcon, PlusIcon } from 'lucide-vue-next';
import { selectAndSetRootPath } from '~/api/rootPath';
import FolderNodeSchema from '~/components/Views/Schema/FolderNodeSchema.vue';
import { useRootPathInjectSafe } from '~/composables/data/providers';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import PageTemplate from './common/PageTemplate.vue';

const rootPath = useRootPathInjectSafe();
const tabsStore = useTabsStoreV2();
const qc = useQueryCache();

const changeRootPathHandler = async () => {
  await selectAndSetRootPath(qc);
};

const isNewFolderDialogOpen = ref(false);
const newFolderName = ref('');
const folderCreationPath = ref('');

const folderWhereToCreateName = computedAsync(async () => {
  if (!folderCreationPath.value) return '';
  return await path.basename(folderCreationPath.value);
});

const createNewFolder = async () => {
  const actualFolderCreationPath =
    folderCreationPath.value === rootPath.value ? '' : folderCreationPath.value;

  await mkdir(await path.join(rootPath.value, actualFolderCreationPath, newFolderName.value));
  isNewFolderDialogOpen.value = false;
};

const { folders, isPending, foldersAsTree } = useFoldersList();

const allFolderIds = computed(() => {
  return folders.value?.folders.map((v) => v.path) ?? [];
});

const addNewSchema = async (folderName: string, folderPath: string) => {
  await c_save_schema(folderPath, {
    items: [],
    name: folderName,
    version: 'to be set by backend',
  }).catch((e) => {
    console.log(e);
  });

  qc.invalidateQueries({ key: ['schemas'] });
};
</script>
