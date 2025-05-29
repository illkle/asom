<template>
  <div class="mx-auto max-w-4xl w-full">
    <div class="flex items-center justify-between">
      <h1 class="mb-4 font-serif text-3xl">Directories & Schemas</h1>
      <Button @click="navigateTo('/', { replace: true })" variant="outline">Save </Button>

      <Link href="/"> </Link>
    </div>

    <div class="flex items-center justify-between mt-4">
      <div class="flex flex-col gap-1">
        <div>Root path:</div>
        <div class="font-mono text-sm opacity-30">
          {{ rootPath.data.value }}
        </div>
      </div>
      <Button variant="ghost" @click="changeRootPathHandler">Change root path</Button>
    </div>

    <Button
      variant="outline"
      size="sm"
      class="mt-6 ml-auto w-fit bg-transparent dark:bg-transparent border-b-0 rounded-b-none"
      @click="
        () => {
          folderCreationPath = rootPath.data.value ?? '';
          isNewFolderDialogOpen = true;
        }
      "
    >
      <PlusIcon :size="12" class="mr-2" />
      Create folder
    </Button>

    {{ foldersAsTree.length }}


    <div :class="cn('rounded-lg border px-4 py-6 rounded-tl-none ')">
      <TreeRoot
        v-if="!isPending"
        v-slot="{ flattenItems }"
        :items="foldersAsTree?.[0]?.children || []"
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
          />
        </template>
      </TreeRoot>
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

    <div class="mt-4 text-xs text-muted-foreground">
      Right click to create or delete schema for a folder
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQueryCache } from '@pinia/colada';
import { TreeRoot } from 'reka-ui';
import { c_save_schema } from '~/api/tauriActions';

import { mkdir } from '@tauri-apps/plugin-fs';
import { FolderIcon, PlusIcon } from 'lucide-vue-next';
import path from 'path-browserify';
import { selectAndSetRootPath } from '~/api/rootPath';
import FolderNodeSchema from '~/components/SchemaEditor/FolderNodeSchema.vue';

const rootPath = useRootPath();

watch(rootPath.data, (v) => {
  if (!v) {
    navigateTo('/', { replace: true });
  }
});

const changeRootPathHandler = async () => {
  await selectAndSetRootPath();
};

const isNewFolderDialogOpen = ref(false);
const newFolderName = ref('');
const folderCreationPath = ref('');

const folderWhereToCreateName = computed(() => {
  return path.basename(folderCreationPath.value);
});

const createNewFolder = async () => {
  await mkdir(path.join(folderCreationPath.value, newFolderName.value));
  isNewFolderDialogOpen.value = false;
};

const qc = useQueryCache();

const { folders, isPending, refetch, throttledRefetch, foldersAsTree } = useFoldersList();

const allFolderIds = computed(() => {
  return folders.value?.folders.map((v) => v.path) ?? [];
});

const addNewSchema = async (folderName: string, folderPath: string) => {
  await c_save_schema(folderPath, {
    items: [],
    name: folderName,
    version: 'to be set by backend',
    icon: '',
  }).catch((e) => {
    console.log(e);
  });

  qc.invalidateQueries({ key: ['schemas'] });
};
</script>
