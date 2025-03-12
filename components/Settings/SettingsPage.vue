<template>
  <ShDialogTitle>Settings</ShDialogTitle>
  <div v-if="s.settings" class="w-full max-w-[500px]">
    <PathControllerVue
      v-if="store.rootPath"
      title="Working Directory"
      :path="store.rootPath"
      @change="changeRootPathHandler"
    />

    <div class="mt-4 flex flex-col gap-2">
      <div>Schemas: {{ schemas?.length }}</div>
      <ShButton class="w-fit min-w-36" variant="outline" @click="navigateTo('/schemas')">
        Edit
      </ShButton>
    </div>

    <div class="mt-4">
      <h2 class="mb-2 font-semibold">Theme</h2>

      <ShSelect v-model="colorMode.preference" class="w-40">
        <ShSelectTrigger>
          <ShSelectValue placeholder="Sort by" />
        </ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem value="light">Light</ShSelectItem>
          <ShSelectItem value="system">System</ShSelectItem>
          <ShSelectItem value="dark">Dark</ShSelectItem>
        </ShSelectContent>
      </ShSelect>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import PathControllerVue from './PathController.vue';

import { selectAndSetRootPath } from '~/api/rootPath';
import { useSettingsStore } from '~/composables/stores/useSettingsStore';
import { useMainStore } from '~/composables/stores/useMainStore';

const s = useSettingsStore();
const colorMode = useColorMode();

const store = useMainStore();

const { data: schemas, error } = useUsableSchemas();

const darkMode = computed({
  get: () => {
    return s.settings?.darkMode || 'System';
  },
  set: async (val) => {
    if (!s.settings) return;

    await s.updateSettings({ darkMode: val });
  },
});

const importHTMLButton = ref<HTMLElement>();

const importHTML = () => {
  if (importHTMLButton.value) importHTMLButton.value.click();
};

const changeRootPathHandler = async () => {
  const updated = await selectAndSetRootPath();
  if (updated) {
    store.fetchRootPath();
  }
};
</script>

<style scoped></style>
