<template>
  <ContextMenu v-if="imagePath">
    <ContextMenuTrigger>
      <div class="w-full rounded-md overflow-hidden" :style="ar">
        <img :src="imagePath" class="w-full h-full object-cover object-center" draggable="false" />
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem @click="changeImageHandler"> Change Image </ContextMenuItem>
      <ContextMenuItem @click="removeImageHandler"> Remove </ContextMenuItem>
      <ContextMenuItem v-if="pathFolder" @click="() => pathFolder && openPath(pathFolder)">
        Show in {{ fileManagerName }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
  <div
    v-else-if="imageName"
    class="flex flex-col shrink-1 items-center justify-center border p-1.5 rounded-md text-xs text-muted-foreground text-center"
    :style="ar"
    @click="changeImageHandler"
  >
    File not found
  </div>
  <div
    class="relative w-full rounded-md border flex items-center flex-col justify-center"
    :style="ar"
    v-else
    @click="changeImageHandler"
  >
    <CommonLabel v-if="!hideLabel">{{ name }}</CommonLabel>
    <span
      class="text-xs text-center absolute bottom-0 left-1/2 max-w-fit w-full -translate-x-1/2 border-b-0 rounded-b-none text-muted-foreground border p-1.5 rounded-md"
      >Select image</span
    >
  </div>
</template>

<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog';
import { copyFile, exists, mkdir } from '@tauri-apps/plugin-fs';

import { convertFileSrc } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';
import { computedAsync } from '@vueuse/core';
import path from 'path-browserify';
import type { CSSProperties } from 'vue';
import type { ImageSettings } from '~/types';
import CommonLabel from './CommonLabel.vue';

const imageName = defineModel<string | null>();
const props = defineProps<{
  name: string;
  hideLabel?: boolean;
  disabled?: boolean;
  settings: ImageSettings;
}>();

const ar = computed(() => {
  return {
    aspectRatio: props.settings.aspectRatio ?? '1 / 1',
  } as CSSProperties;
});

const rootPath = useRootPath();

const filePath = computed(() => {
  if (!imageName.value || !rootPath.data.value) return null;
  return path.join(rootPath.data.value, '.assets', imageName.value);
});

const pathFolder = computed(() => {
  if (!filePath.value) return null;
  return path.dirname(filePath.value);
});

const imagePath = computedAsync(async () => {
  if (!filePath.value) return null;
  const fileExistst = await exists(filePath.value);
  if (!fileExistst) return null;
  return await convertFileSrc(filePath.value);
});

const changeImageHandler = async () => {
  if (props.disabled) return;
  if (!rootPath.data.value) return;

  const result = await open({
    multiple: false,
    directory: false,
  });

  if (!result) return;

  const basename = generateUniqId() + path.extname(result);

  const folder = path.join(rootPath.data.value, '.assets');

  const folderExists = await exists(folder);
  if (!folderExists) {
    await mkdir(folder, { recursive: true });
  }

  await copyFile(result, path.join(folder, basename));

  imageName.value = basename;
};

const removeImageHandler = () => {
  imageName.value = null;
};

const fileManagerName = useFileManagerName();
</script>
