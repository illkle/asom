<template>
  <SidebarProvider>
    <AppSidebar v-if="canShowApp" class="box-border" />

    <main class="relative flex w-36 flex-1 flex-col h-screen max-h-screen box-border">
      <div class="shrink-0 flex justify-between gap-2">
        <div class="flex-1 pt-[0.5rem]" v-if="canShowApp">
          <TabsSelector />
        </div>
        <div
          v-else
          data-tauri-drag-region
          class="dragApp w-full h-full pt-[2rem] z-100 bg-background"
        ></div>
        <CustomWindowButtons />
      </div>
      <!-- InitQ returned a root path, show app -->
      <RouterMain v-if="canShowApp" />
      <!-- loading\no root\error -->
      <div
        v-else
        class="flex w-full flex-col items-center justify-center h-[calc(100svh-2rem)] bg-background"
      >
        <InitProcess
          :query="rootPath"
          @lockForOnboarding="lockedInIntro = true"
          @unlockFromOnboarding="lockedInIntro = false"
        />
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
import { useSidebar } from './ui/sidebar';

const rootPath = useRootPathFromQuery();
useProvideRootPath(rootPath);
const lockedInIntro = ref(false);
const canShowApp = computed(() => rootPath.data.value && !lockedInIntro.value);
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
