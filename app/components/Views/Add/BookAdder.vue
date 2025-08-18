<template>
  <Dialog v-model:open="newFileOpened" @update:open="newFileName = ''">
    <DialogTrigger class="w-full" as-child>
      <slot />
    </DialogTrigger>

    <DialogContent class="">
      <DialogTitle> Create new file </DialogTitle>

      <ApiSearchRouter :connection="apiConnection.q.data.value" />

      <div class="flex flex-col gap-2">
        <Input ref="inputRef" autofocus v-model:model-value="newFileName" placeholder="Filename" />

        <div class="flex" v-if="schemasArray.length > 1">
          <Button
            v-for="(schema, index) in schemasArray"
            :key="schema[0]"
            :variant="selectedSchemaIndex === index ? 'default' : 'outline'"
            class="first:rounded-l-md rounded-none grow last:rounded-r-md border-r-0 last:border-r"
            @click="selectedSchemaIndex = index"
          >
            {{ schema[1].name }}
          </Button>
        </div>
      </div>

      <Button variant="outline" size="default" @click="addThing"> Create </Button>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { path as tauriPath } from '@tauri-apps/api';
import { exists, writeTextFile } from '@tauri-apps/plugin-fs';
import { computedAsync, useEventListener } from '@vueuse/core';
import path from 'path-browserify';
import { toast } from 'vue-sonner';
import ApiSearchRouter from '~/components/Views/Schema/ApiSettings/ApiSearchRouter.vue';
import { useNavigationBlock, useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const inputRef = useTemplateRef<HTMLInputElement>('inputRef');

const newFileOpened = ref(false);
useNavigationBlock(newFileOpened);

const tabsStore = useTabsStoreV2();

const { schemasArray } = useUsableSchemas();

const selectedSchemaIndex = ref<number | null>(null);

const selectedSchema = computed(() => {
  if (selectedSchemaIndex.value === null) return null;
  return schemasArray.value[selectedSchemaIndex.value];
});

const pathFromTab = computed(() => {
  if (!tabsStore.openedItem) return '';
  if (tabsStore.openedItem._type === 'file') return path.dirname(tabsStore.openedItem._path);

  if (tabsStore.openedItem._type === 'folder') return tabsStore.openedItem._path;

  return '';
});

const sc = useSchemaByPath(pathFromTab);

const apiConnection = useApiConnection(computed(() => selectedSchema.value?.[0]));

watch(newFileOpened, (v) => {
  if (v) {
    selectedSchemaIndex.value = null;

    if (sc.data.value) {
      const index = schemasArray.value.findIndex(([p]) => p === sc.data.value?.owner_folder);
      if (index !== -1) {
        selectedSchemaIndex.value = index;
      }
    }
  }
});

const ts = useTabsStoreV2();

const newFileName = ref('');

const actualFilename = computed(() => {
  return newFileName.value.endsWith('.md') ? newFileName.value : newFileName.value + '.md';
});

const folderToSaveDisplay = computedAsync(() => {
  if (!selectedSchema.value?.[0]) return null;
  return tauriPath.join(selectedSchema.value[0], actualFilename.value);
});

const addThing = async () => {
  if (!newFileName.value.length) {
    toast.error('Please enter a non empty file name');
    return;
  }

  if (!pathFromTab.value) {
    toast.error('Please open a folder to save the file');
    return;
  }

  const finalPath = await tauriPath.join(pathFromTab.value, actualFilename.value);

  const ex = await exists(finalPath);
  if (ex) {
    toast.error('File with this name already exists');
    return;
  }

  await writeTextFile(finalPath, '');

  ts.openNewThingFast({ _type: 'file', _path: finalPath }, 'last');
  newFileOpened.value = false;
};

const isMacOS = useIsMac();
useEventListener('keydown', (e) => {
  const commandKey = (isMacOS && e.metaKey) || (!isMacOS && e.ctrlKey);

  if (commandKey && e.key === 'n') {
    newFileOpened.value = true;
  }
});
</script>
