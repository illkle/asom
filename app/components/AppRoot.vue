<template>
  <SidebarProvider>
    <AppSidebar v-if="hasRootPath" class="box-border" />

    <main class="relative flex w-36 flex-1 flex-col h-screen max-h-screen box-border">
      <div class="shrink-0 flex justify-between gap-2">
        <div class="flex-1 pt-[0.5rem]" v-if="hasRootPath">
          <TabsSelector />
        </div>
        <div v-else data-tauri-drag-region class="dragApp w-full h-full pt-[0.5rem]"></div>
        <CustomWindowButtons />
      </div>
      <!-- InitQ returned a root path, show app -->
      <RouterMain v-if="hasRootPath" />
      <!-- loading\no root\error -->
      <div v-else class="flex w-full flex-col items-center justify-center h-[calc(100svh-2rem)]">
        <div class="bg-background rounded-md p-4">
          <InitProcess :query="rootPath" />
        </div>
      </div>
    </main>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { useRootPathFromQuery } from '~/composables';
import { useProvideRootPath } from '~/composables/data/providers';
import AppSidebar from './Core/AppSidebar.vue';
import CustomWindowButtons from './Core/CustomWindowButtons.vue';
import InitProcess from './Core/InitProcess.vue';
import TabsSelector from './Core/Tabs/TabsSelector.vue';
import RouterMain from './RouterMain.vue';

const rootPath = useRootPathFromQuery();

useProvideRootPath(rootPath);

const hasRootPath = computed(() => rootPath.data.value);
</script>

<style>
.customCols {
  grid-template-columns: min-content min-content 1fr;
  grid-template-rows: min-content 100%;
}

.gutter-stable {
  scrollbar-gutter: stable;
  overflow-y: scroll;
}
</style>
