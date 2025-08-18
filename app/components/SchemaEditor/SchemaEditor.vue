<template>
  <div class="mx-auto max-w-4xl w-full px-5">
    <div class="flex items-center justify-between pt-10">
      <h1 class="mb-4 font-serif text-3xl">Directories & Schemas</h1>
      <Button @click="emit('exit-schema-editor')" variant="outline">Save & Exit</Button>
    </div>

    <div class="flex items-center justify-between mt-4">
      <div class="flex flex-col gap-1">
        <div>Root path:</div>
        <div class="font-mono text-xs opacity-30 w-1/2">
          {{ rootPath.data.value }}
        </div>
      </div>
      <Button variant="outline" @click="changeRootPathHandler">Change root path</Button>
    </div>

    <div class="grid grid-cols-2 mt-6 gap-4">
      <div class="flex flex-col gap-2 pt-8">
        <div
          v-for="schema in existingSchemas.schemasArray.value"
          :key="schema[0]"
          class="px-2 border py-2 rounded-md"
        >
          <div class="font-mono text-xl">
            {{ schema[1].name }}
          </div>

          <div class="flex gap-2 mt-2">
            <Button variant="outline" size="sm" @click="emit('edit-schema', schema[0])">
              Schema
            </Button>

            <Button variant="outline" size="sm" @click="emit('edit-layout', schema[0])">
              Layout Editor
            </Button>
            <Button variant="outline" size="sm" @click="emit('edit-api-connection', schema[0])"
              >API</Button
            >
          </div>
        </div>
      </div>

      <div>
        <Button
          variant="outline"
          size="sm"
          class="ml-auto w-fit bg-transparent dark:bg-transparent border-b-0 rounded-b-none"
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
                @edit-schema="(v) => emit('edit-schema', v)"
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

const emit = defineEmits<{
  (e: 'edit-schema', item: string): void;
  (e: 'edit-layout', item: string): void;
  (e: 'edit-api-connection', item: string): void;
  (e: 'exit-schema-editor'): void;
}>();

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

const existingSchemas = useExistingSchemas();

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
