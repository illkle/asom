<template>
  <div class="px-4 pb-4"></div>

  <div class="mx-auto max-w-[600px]">
    <div class="flex flex-row items-center justify-between">
      <h1 class="font-serif text-3xl">Collections</h1>
      <ShDialog>
        <ShDialogTrigger>
          <ShButton>Add new collection</ShButton>
        </ShDialogTrigger>

        <ShDialogContent v-model:open="isCreateDialogOpen">
          <ShDialogTitle>Create new collection</ShDialogTitle>

          <div>
            <h4>Collection name (folder name)</h4>
            <BasicInput v-model="newSchemaName" size="M" class="mt-2 font-mono" />
            <template v-if="defaultSchemas && defaultSchemas.length > 0">
              <h4 class="mt-4">Template</h4>

              <ShSelect v-model:model-value="newSchemaTemplate">
                <ShSelectTrigger class="mt-2"> {{ selectedDefaultSchema?.name }}</ShSelectTrigger>
                <ShSelectContent class="max-h-[200px]">
                  <ShSelectItem
                    v-for="(s, i) in defaultSchemas"
                    size="xs"
                    variant="outline"
                    :key="s.name"
                    :value="String(i)"
                  >
                    <div>
                      {{ s.name }}
                    </div>
                    <div class="text-xs opacity-70">
                      {{ s.description }}
                    </div>
                  </ShSelectItem>
                </ShSelectContent>
              </ShSelect>
              <p class="mt-2 font-mono text-xs opacity-70"></p>
              <p></p>
            </template>
            <ShButton variant="outline" class="mt-4 w-full" @click="addNewSchema">Create</ShButton>
          </div>
        </ShDialogContent>
      </ShDialog>
    </div>

    {{ rootPath }}

    <template v-if="typeof schemas === 'object' && !schemasPending">
      <template v-if="Object.keys(schemas.schemas).length > 0">
        <div
          v-for="schema in Object.values(schemas.schemas)"
          :key="schema?.internal_name || ''"
          variant="outline"
          class="mt-6 flex flex-col gap-4"
        >
          <ShButton
            v-if="schema"
            as-child
            class="flex h-fit cursor-pointer flex-col gap-2 rounded-none border px-4 py-2"
          >
            <NuxtLink :to="{ name: 'schemas-path', params: { path: schema.internal_path } }">
              <div class="text-lg">
                {{ schema.name }}
              </div>
              <div class="font-mono text-xs opacity-70">
                <template v-if="schema.items.length > 0" v-for="item in schema.items"
                  >{{ item.name }}{{ ' ' }}
                </template>
                <template v-else>This schema is empty and will not appear in the app</template>
              </div>
            </NuxtLink>
          </ShButton>
        </div>
      </template>
      <div v-else>
        <h2>You do not have any schemas yet</h2>
      </div>
      <ShButton
        :disabled="Object.keys(schemas.schemas).length == 0"
        class="mt-4 w-full"
        variant="outline"
        as-child
      >
        <NuxtLink href="/"> Save and exit </NuxtLink>
      </ShButton>

      <ShCollapsible v-if="schemas?.error?.subErrors?.length" class="mt-8 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h2 class="font-serif text-xl">
            Folders with invalid schemas: {{ schemas?.error?.subErrors?.length }}
          </h2>
          <ShCollapsibleTrigger>
            <ShButton variant="ghost">Show</ShButton>
          </ShCollapsibleTrigger>
        </div>

        <ShCollapsibleContent class="flex flex-col gap-3">
          <div v-for="e in schemas?.error?.subErrors" class="rounded-md">
            <div>{{ e.title }}</div>
            <div class="text-sm opacity-50">{{ e.info }}</div>
            <div class="font-mono text-xs opacity-50">{{ e.rawError }}</div>
          </div></ShCollapsibleContent
        >
      </ShCollapsible>
    </template>

    <FileTreeInner v-for="folder in transformedFolders" :content="folder" />
  </div>
</template>

<script setup lang="ts">
import {
  c_get_all_folders,
  c_get_default_schemas,
  c_load_schemas,
  c_save_schema,
} from '~/api/tauriActions';
import { useQuery, useQueryCache } from '@pinia/colada';
import BasicInput from '../_UI/BasicInput.vue';
import { filePathsToTree } from '../FileTree/filePathsToTree';

const editingSchemaPath = ref<string | null>(null);

const qc = useQueryCache();

const { data: defaultSchemas, error: defaultSchemasError } = useQuery({
  key: ['defaultSchemas'],
  query: c_get_default_schemas,
});

const { data: schemas, isPending: schemasPending } = useQuery({
  key: ['schemas', 'load'],
  query: c_load_schemas,
});

const { data: folders, isPending: foldersPending } = useQuery({
  key: ['folders', 'all'],
  query: c_get_all_folders,
});

const { rootPath } = useStore();

const transformedFolders = computed(() =>
  !folders.value || 'isError' in folders.value
    ? []
    : filePathsToTree(folders.value, rootPath || ''),
);

const addNewSchema = async () => {
  if (!newSchemaName.value || !selectedDefaultSchema.value) return;
  const res = await c_save_schema(newSchemaName.value, {
    items: selectedDefaultSchema.value.schema_items,
    name: newSchemaName.value,
    internal_name: newSchemaName.value,
    internal_path: '',
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
