<template>
  <ContextMenu v-if="imagePath">
    <ContextMenuTrigger :as-child="true">
      <div v-bind="$attrs" class="w-full rounded-md overflow-hidden" :style="ar">
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
    class="flex flex-col shrink items-center justify-center border p-1.5 rounded-md text-xs text-muted-foreground text-center"
    :style="ar"
    v-bind="$attrs"
    @click="changeImageHandler"
  >
    File not found
  </div>
  <div
    class="relative w-full rounded-md border flex items-center flex-col justify-center"
    :style="ar"
    v-else
    v-bind="$attrs"
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
import { convertFileSrc } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';
import { computedAsync } from '@vueuse/core';

import { path } from '@tauri-apps/api';
import type { CSSProperties } from 'vue';
import { saveImageFromSelection } from '~/components/Api/saveImage';
import { useRootPathInjectSafe } from '~/composables/data/providers';
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

const rootPath = useRootPathInjectSafe();
// Used for testing without tauri
const isPreviewMode = inject<boolean>('PREVIEW_MODE');

const filePath = computed(() => {
  if (isPreviewMode) return null;
  if (!imageName.value || !rootPath.value) return null;
  return [rootPath.value, '.assets', imageName.value].join(path.sep());
});

const pathFolder = computed(() => {
  if (!filePath.value) return null;
  return [rootPath.value, '.assets'].join(path.sep());
});

const imagePath = computedAsync(async () => {
  if (!filePath.value) return null;
  return convertFileSrc(filePath.value);
});

const changeImageHandler = async () => {
  if (props.disabled) return;
  if (!rootPath.value) return;

  const res = await saveImageFromSelection(rootPath.value, props.name);

  if (!res) return;

  imageName.value = res;
};

const removeImageHandler = () => {
  imageName.value = null;
};

const fileManagerName = useFileManagerName();
</script>
