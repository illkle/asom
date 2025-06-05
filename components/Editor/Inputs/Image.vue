<template>
  <ContextMenu v-if="imagePath">
    <ContextMenuTrigger>
      <div class="max-w-[200px] rounded-md overflow-hidden">
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
    class="flex max-w-[200px] h-full w-full items-center justify-center"
    @click="changeImageHandler"
  >
    File not found: {{ imageName }}
  </div>
  <div
    class="max-w-[200px] relative w-full rounded-md border flex items-center flex-col justify-center"
    v-else
    @click="changeImageHandler"
  >
    <EditorInputsCommonLabel v-if="!hideLabel">{{ name }}</EditorInputsCommonLabel>
    <span
      class="text-xs absolute bottom-0 left-1/2 max-w-fit w-full -translate-x-1/2 border-b-0 rounded-b-none text-muted-foreground border p-1.5 rounded-md"
      >Select image</span
    >
  </div>
</template>

<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog';
import { copyFile, exists } from '@tauri-apps/plugin-fs';

import { convertFileSrc } from '@tauri-apps/api/core';
import { computedAsync } from '@vueuse/core';
import path from 'path-browserify';

const imageName = defineModel<string | null>();
const props = defineProps<{
  name: string;
  hideLabel?: boolean;
  disabled?: boolean;
}>();

const rootPath = useRootPath();

const imagePath = computedAsync(async () => {
  if (!imageName.value || !rootPath.data.value) return null;
  const p = path.join(rootPath.data.value, imageName.value);
  const fileExistst = await exists(p);
  if (!fileExistst) return null;
  return await convertFileSrc(p);
});

const changeImageHandler = async () => {
  if (props.disabled) return;
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
