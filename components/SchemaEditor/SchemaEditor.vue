<template>
  <div class="px-4 pb-4"></div>

  <div class="mx-auto max-w-[600px]">
    <div class="flex items-center justify-between">
      <h1 class="mb-4 font-serif text-3xl">Directories & Schemas</h1>
      <ShButton @click="navigateTo('/')" variant="outline">Save </ShButton>

      <Link href="/"> </Link>
    </div>

    <div class="flex items-center justify-between mt-4">
      <div class="flex flex-col gap-1">
        <div>Root path:</div>
        <div class="font-mono text-sm opacity-30">
          {{ rootPath.data.value }}
        </div>
      </div>
      <ShButton variant="ghost" @click="changeRootPathHandler">Change root path</ShButton>
    </div>

    <ShButton
      variant="outline"
      size="xs"
      class="mt-6 ml-auto w-fit border-neutral-200 px-2 rounded-t-lg dark:border-neutral-900 border border-b-0"
      @click="
        () => {
          folderCreationPath = rootPath.data.value ?? '';
          isNewFolderDialogOpen = true;
        }
      "
    >
      <PlusIcon :size="12" class="mr-2" />
      Create folder
    </ShButton>
    <div
      :class="
        cn(
          'rounded-lg border px-4 py-6  rounded-tl-none border-neutral-200 dark:border-neutral-900',
        )
      "
    >
      <TreeRoot
        v-if="!isPending && !schemasPending"
        v-slot="{ flattenItems }"
        :items="foldersAsTree?.[0]?.children || []"
        :default-expanded="allFolderIds"
        multiple
        :get-key="(opt) => opt.rawPath"
        class="flex flex-col gap-2"
      >
        <template v-for="item in flattenItems">
          <FolderNode
            :item="item"
            @add-new-schema="addNewSchema"
            @create-folder="(v) => ((isNewFolderDialogOpen = true), (folderCreationPath = v))"
          />
        </template>
      </TreeRoot>
    </div>

    <ShDialog v-model:open="isNewFolderDialogOpen">
      <ShDialogContent>
        <ShDialogTitle>Create new folder</ShDialogTitle>
        <ShButton
          variant="outline"
          :disabled="true"
          size="sm"
          class="flex w-full justify-start gap-2"
        >
          <FolderIcon :size="12" />
          {{ folderWhereToCreateName }}
        </ShButton>
        <ShInput v-model="newFolderName" @keydown.enter="createNewFolder" />
        <ShButton :disabled="!newFolderName" @click="createNewFolder"> Create </ShButton>
      </ShDialogContent>
    </ShDialog>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryCache } from '@pinia/colada';
import { TreeRoot } from 'reka-ui';
import { c_get_default_schemas, c_get_schemas, c_save_schema } from '~/api/tauriActions';

import { mkdir } from '@tauri-apps/plugin-fs';
import { FolderIcon, PlusIcon } from 'lucide-vue-next';
import path from 'path-browserify';
import { selectAndSetRootPath } from '~/api/rootPath';
import { useFoldersList } from '~/composables/useFoldersList';
import FolderNode from './FolderNode.vue';

const rootPath = useRootPath();

watch(rootPath.data, (v) => {
  if (!v) {
    navigateTo('/');
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

const { data: defaultSchemas, error: defaultSchemasError } = useQuery({
  key: ['root', 'defaultSchemas'],
  query: c_get_default_schemas,
});

const { data: schemas, isPending: schemasPending } = useQuery({
  key: ['root', 'schemas', 'load'],
  query: c_get_schemas,
});

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

const newSchemaTemplate = ref<string>('0');
const selectedDefaultSchema = computed(() => {
  if (!defaultSchemas.value) return null;
  return defaultSchemas.value[Number(newSchemaTemplate.value)];
});

const router = useRouter();

const openSchemaEditor = (path: string) => {
  router.push(`/schemas/edit?path=${path}`);
};
</script>
