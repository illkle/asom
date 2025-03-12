<template>
  <div class="px-4 pb-4"></div>

  <div class="mx-auto max-w-[600px]">
    <h1 class="mb-4 font-serif text-3xl">Directories & Schemas</h1>

    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <div>Root path:</div>
        <div class="font-mono text-sm opacity-30">
          {{ store.rootPath }}
        </div>
      </div>
      <ShButton variant="outline">Change root path</ShButton>
    </div>

    <div class="mt-6 rounded-lg border px-4 py-6 dark:border-neutral-900">
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
          <TreeItem v-bind="item.bind" v-slot="{ isExpanded }">
            <ShContextMenu>
              <ShContextMenuTrigger class="w-full">
                <div :style="`padding-left: ${item.level - 1}rem`" class="flex items-center gap-2">
                  <ShButton
                    variant="outline"
                    size="xs"
                    class="flex w-full justify-start gap-2"
                    :class="cn(!item.value.hasSchema && 'opacity-50')"
                  >
                    <ChevronDown
                      v-if="item.value.children.length > 0"
                      :size="12"
                      :class="[!isExpanded && '-rotate-90']"
                    />
                    <FolderIcon v-else :size="12" />

                    {{ item.value.name }}

                    <div
                      v-if="item.value.ownSchema"
                      class="ml-auto flex items-center gap-2 text-xs opacity-80"
                    >
                      <FileIcon :size="12" />

                      Schema owner
                    </div>
                  </ShButton>
                  <div v-if="item.value.ownSchema" class="ml-auto flex items-center gap-2 text-xs">
                    <ShButton
                      v-if="item.value.schemaFilePath"
                      variant="outline"
                      size="xs"
                      @click.stop="openSchemaEditor(item.value.schemaFilePath)"
                      >Edit</ShButton
                    >
                  </div>
                </div>
              </ShContextMenuTrigger>
              <ShContextMenuContent>
                <ShContextMenuItem v-if="item.value.hasSchema" @click="">
                  Edit schema
                </ShContextMenuItem>
                <ShContextMenuItem
                  v-if="!item.value.ownSchema"
                  @click="addNewSchema(item.value.name, item.value.rawPath)"
                >
                  Create schema
                </ShContextMenuItem>
                <ShContextMenuItem v-if="item.value.ownSchema" @click="">
                  Delete schema
                </ShContextMenuItem>

                <ShContextMenuSeparator />

                <ShContextMenuItem
                  @click="async () => await remove(item.value.rawPath, { recursive: true })"
                >
                  Delete Folder
                </ShContextMenuItem>
              </ShContextMenuContent>
            </ShContextMenu>
          </TreeItem>
        </template>
      </TreeRoot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  c_get_all_folders,
  c_get_default_schemas,
  c_get_schemas,
  c_save_schema,
} from '~/api/tauriActions';
import { useQuery, useQueryCache } from '@pinia/colada';
import { TreeItem, TreeRoot } from 'reka-ui';
import { ChevronDown, FolderIcon, FileIcon } from 'lucide-vue-next';

import { remove } from '@tauri-apps/plugin-fs';
import { useFoldersList } from '~/composables/useFoldersList';
import { useMainStore } from '~/composables/stores/useMainStore';

const qc = useQueryCache();

const { data: defaultSchemas, error: defaultSchemasError } = useQuery({
  key: ['defaultSchemas'],
  query: c_get_default_schemas,
});

const { data: schemas, isPending: schemasPending } = useQuery({
  key: ['schemas', 'load'],
  query: c_get_schemas,
});

const { folders, isPending, refetch, throttledRefetch, foldersAsTree } = useFoldersList();

const store = useMainStore();

onMounted(() => {
  if (!store.rootPath) {
    store.fetchRootPath();
  }
});

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
