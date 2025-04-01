<template>
  <Dialog v-model:open="settingsOpened">
    <DialogContent>
      <Settings />
    </DialogContent>
  </Dialog>
  <div class="flex items-center justify-start py-2">
    <Button variant="ghost" size="icon" @click="() => (settingsOpened = !settingsOpened)">
      <Settings2Icon stroke-width="1" />
    </Button>

    <Button variant="ghost" size="icon">
      <PlusIcon stroke-width="1" />
    </Button>
  </div>
</template>

<script lang="ts" setup>
// TODO: DELETE
import Settings from '../Settings/SettingsPage.vue';

import { PlusIcon, Settings2Icon } from 'lucide-vue-next';

const settingsOpened = ref(false);
</script>
