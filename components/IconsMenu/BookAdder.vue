<template>
  <Dialog v-model:open="newFileOpened" @update:open="newFileName = ''">
    <DialogTrigger class="w-full" as-child>
      <slot />
    </DialogTrigger>

    <DialogContent>
      <DialogTitle> Create new file </DialogTitle>
      <Input
        @keyup.enter="addBook"
        autofocus
        v-model:model-value="newFileName"
        placeholder="Filename"
      />

      <div class="max-w-96 text-xs opacity-50">Saving to: {{ folderToSaveDisplay }}</div>
      <Button variant="outline" size="default" @click="addBook"> Create </Button>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { path as tauriPath } from '@tauri-apps/api';
import { exists, writeTextFile } from '@tauri-apps/plugin-fs';
import { computedAsync } from '@vueuse/core';
import { toast } from 'vue-sonner';
import { useNavigationBlock, useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
const props = defineProps({
  pathToSave: {
    type: String,
    required: true,
  },
});

const ts = useTabsStoreV2();

const newFileOpened = ref(false);
useNavigationBlock(newFileOpened);
const newFileName = ref('');

const actualFilename = computed(() => {
  return newFileName.value.endsWith('.md') ? newFileName.value : newFileName.value + '.md';
});

const folderToSaveDisplay = computedAsync(() => {
  return tauriPath.join(props.pathToSave, actualFilename.value);
});

const addBook = async () => {
  if (!newFileName.value.length) {
    toast.error('Please enter a non empty file name');
    return;
  }

  const finalPath = await tauriPath.join(props.pathToSave, actualFilename.value);

  const ex = await exists(finalPath);
  if (ex) {
    toast.error('File with this name already exists');
    return;
  }

  await writeTextFile(finalPath, '');

  ts.openNewThingFast({ _type: 'file', _path: finalPath }, 'last');
  newFileOpened.value = false;
};
</script>
