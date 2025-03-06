<template>
  <div class="relative h-full w-full overflow-hidden @container">
    <div
      v-if="!showImage"
      class="absolute left-0 top-0 flex h-full w-full flex-col rounded-md border border-neutral-200 p-3 shadow-lg transition-opacity dark:border-neutral-800"
    >
      <div
        class="title x h-1/2 shrink overflow-hidden align-middle text-xs leading-tight @[10rem]:text-lg"
      >
        {{ mainTitle }}
      </div>
      <hr class="my-2 h-[1px] w-full border-0 bg-neutral-50 dark:bg-neutral-900" />
      <div class="author @[10rem]:text-md flex-grow text-xs font-semibold">
        {{ file.attrs.author.Text || 'Unknown' }}
      </div>
    </div>
    <div v-else class="flex h-full items-end overflow-hidden rounded-md">
      <img
        :src="data || ''"
        class="block h-full w-full object-cover"
        @error="() => (forceFake = true)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce as _debounce } from 'lodash';
import { convertFileSrc } from '@tauri-apps/api/core';

import type { PropType } from 'vue';
import type { BookFromDb } from '~/types';
import { getSettings } from '~/api/settings';
import path from 'path-browserify';

const props = defineProps({
  file: {
    type: Object as PropType<BookFromDb>,
    required: true,
  },
});

const locateCover = async (filename: string) => {
  const root = rootPathFromStore();
  const localSettings = await getSettings();
  return await path.join(root, localSettings.coversPath, filename);
};

const { data } = useAsyncData(
  'cover:' + props.file.attrs.cover.Text,
  async () => {
    if (!props.file.attrs.cover) return null;
    const p = await locateCover(props.file.attrs.cover.Text);
    if (!p) return null;

    return await convertFileSrc(p);
  },
  { watch: [() => props.file.attrs.cover.Text] },
);

const forceFake = ref(false);

const showImage = computed(() => data.value && !forceFake.value);

watch(
  () => props.file.attrs.cover,
  () => {
    if (props.file.attrs.cover) {
      forceFake.value = false;
    } else {
      forceFake.value = true;
    }
  },
);

const mainTitle = computed(() =>
  props.file.attrs.title.Text ? props.file.attrs.title.Text.split(':')[0] : 'Unknown',
);
</script>

<style scoped></style>
