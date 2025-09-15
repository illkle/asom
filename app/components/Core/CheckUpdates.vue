<template>
  <Button
    size="none"
    variant="ghost"
    :disabled="
      !updateQ.data.value &&
      !updateQ.error.value &&
      !updateM.error.value &&
      !updateM.isLoading.value
    "
    class="flex items-center gap-1 text-xs"
    @click="handleButtonClick"
  >
    <template v-if="updateQ.data.value">
      {{ currentVersion }} <MoveRightIcon /> {{ updateQ.data.value.version }}
    </template>
    <template v-else>{{ currentVersion }}</template>

    <TriangleAlert v-if="updateQ.error.value" />
    <CircleX v-else-if="updateM.error.value" />
    <div v-else-if="updateM.isLoading.value" class="animate-spin">
      <LoaderCircle :size="16" />
    </div>
  </Button>
</template>

<script lang="ts" setup>
import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { CircleX, LoaderCircle, MoveRightIcon, TriangleAlert } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { useMainStore } from '~/composables/stores/useMainStore';

const mainStore = useMainStore();
const currentVersion = await getVersion();

const handleButtonClick = () => {
  if (updateQ.error.value) {
    mainStore.setError({
      title: 'Error when checking for updates',
      info: String(updateQ.error.value),
      isError: true,
      subErrors: [],
    });
    return;
  }

  if (updateM.error.value) {
    mainStore.setError({
      title: 'Error when updating',
      info: String(updateM.error.value),
      isError: true,
      subErrors: [],
    });
    return;
  }

  if (updateQ.data.value) {
    updateM.mutate();
    return;
  }
};

const updateQ = useQuery({
  key: ['update'],
  query: async () => {
    return await check();
  },
});

const updateM = useMutation({
  mutation: async () => {
    const m = updateQ.data.value;

    if (!m) {
      return;
    }

    // alternatively we could also call update.download() and update.install() separately
    await m.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          break;
        case 'Progress':
          break;
        case 'Finished':
          break;
      }
    });
  },

  onSuccess: async () => {
    await relaunch();
  },
});
</script>
