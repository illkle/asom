<template>
  <ContextMenu v-if="imagePath">
    <ContextMenuTrigger>
      <div class="max-h-[200px] max-w-[200px] rounded-md overflow-hidden">
        <img :src="imagePath" draggable="false" />
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem @click="changeImageHandler"> Change Image </ContextMenuItem>
      <ContextMenuItem @click="removeImageHandler"> Remove </ContextMenuItem>
      <ContextMenuItem> Show file in folder </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
  <div
    v-else-if="imageName"
    class="flex h-full w-full items-center justify-center"
    @click="changeImageHandler"
  >
    File not found: {{ imageName }}
  </div>
  <div
    class="h-46 w-46 rounded-md border border-neutral-200 dark:border-neutral-900 flex items-center flex-col justify-center"
    v-else
    @click="changeImageHandler"
  >
    <span class="text-xs text-neutral-500 dark:text-neutral-400">Select Image</span>
  </div>
</template>

<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog';
import { copyFile, exists } from '@tauri-apps/plugin-fs';

import { convertFileSrc } from '@tauri-apps/api/core';
import { computedAsync } from '@vueuse/core';
import path from 'path-browserify';

const imageName = defineModel<string | null>();

const rootPath = useRootPath();

const imagePath = computedAsync(async () => {
  if (!imageName.value || !rootPath.data.value) return null;
  const p = path.join(rootPath.data.value, imageName.value);
  const fileExistst = await exists(p);
  if (!fileExistst) return null;
  return await convertFileSrc(p);
});

const changeImageHandler = async () => {
  if (!rootPath.data.value) return;

  const result = await open({
    multiple: false,
    directory: false,
  });

  if (!result) return;

  const basename = path.basename(result);

  await copyFile(result, path.join(rootPath.data.value, basename));

  imageName.value = basename;
};

const removeImageHandler = () => {
  imageName.value = null;
};
</script>
