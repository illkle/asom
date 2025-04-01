<template>
  <DialogTitle>Settings</DialogTitle>
  <div v-if="s.settings" class="w-full max-w-[500px]">
    <div class="mt-4 flex flex-col gap-2">
      <span class="font-mono text-xs opacity-50">{{ rootPath.data }}</span>
      <Button class="w-fit min-w-36" variant="outline" @click="navigateTo('/schemas')">
        Root Path & Schema
      </Button>
    </div>

    <div class="mt-4">
      <h2 class="mb-2 font-semibold">Theme</h2>

      <Select v-model="colorMode.preference" class="w-40">
        <SelectTrigger>
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="system">System</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useMainStore } from '~/composables/stores/useMainStore';
import { useSettingsStore } from '~/composables/stores/useSettingsStore';

const s = useSettingsStore();
const colorMode = useColorMode();

const store = useMainStore();

const schemas = useUsableSchemas();
const rootPath = useRootPath();

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
</script>

<style scoped></style>
