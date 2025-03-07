<template>
  <div class="px-4 pb-4"></div>

  <div v-for="(schema, path) in schemas">
    {{ path }}
  </div>

  <div class="mx-auto max-w-[600px]">
    <h1 class="mb-4 font-serif text-3xl">Directories & Schemas</h1>

    <TreeRoot
      v-if="!foldersPending && !schemasPending"
      v-slot="{ flattenItems }"
      :items="transformedFolders?.[0]?.children || []"
      :default-expanded="allFolderIds"
      multiple
      :get-key="(opt) => opt.rawPath"
      class="flex flex-col gap-2"
    >
      <template v-for="item in flattenItems">
        <TreeItem v-bind="item.bind" v-slot="{ isExpanded }">
          <div :style="`padding-left: ${item.level - 1}rem`">
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

              <div v-if="item.value.ownSchema" class="ml-auto flex items-center gap-2 text-xs">
                Schema Owner
                <FileIcon :size="12" />
              </div>
            </ShButton>
          </div>
        </TreeItem>
      </template>
    </TreeRoot>
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
import { filePathsToTree } from '../FileTree/filePathsToTree';
import { TreeItem, TreeRoot, TreeVirtualizer } from 'reka-ui';
import { ChevronDown, FolderDown, FolderIcon, FileIcon } from 'lucide-vue-next';

const selectedPeople = ref([]);

const qc = useQueryCache();

const { data: defaultSchemas, error: defaultSchemasError } = useQuery({
  key: ['defaultSchemas'],
  query: c_get_default_schemas,
});

const { data: schemas, isPending: schemasPending } = useQuery({
  key: ['schemas', 'load'],
  query: c_get_schemas,
});

const { data: folders, isPending: foldersPending } = useQuery({
  key: ['folders', 'all'],
  query: c_get_all_folders,
});

const store = useStore();

onMounted(() => {
  if (!store.rootPath) {
    console.log('fetching root path');
    store.fetchRootPath();
  }
});

const transformedFolders = computed(() =>
  !folders.value || 'isError' in folders.value
    ? []
    : filePathsToTree(folders.value, store.rootPath || ''),
);

const allFolderIds = computed(() => {
  return folders.value?.folders.map((v) => v.path) ?? [];
});

const addNewSchema = async (path: string) => {
  if (!newSchemaName.value || !selectedDefaultSchema.value) return;
  const res = await c_save_schema(path, {
    items: selectedDefaultSchema.value.schema_items,
    name: newSchemaName.value,
    version: 'to be set by backend',
    icon: '',
  });

  isCreateDialogOpen.value = false;

  qc.invalidateQueries({ key: ['schemas'] });
};

const isCreateDialogOpen = ref(false);
const newSchemaName = ref('');
const newSchemaTemplate = ref<string>('0');
const selectedDefaultSchema = computed(() => {
  if (!defaultSchemas.value) return null;
  return defaultSchemas.value[Number(newSchemaTemplate.value)];
});
</script>
