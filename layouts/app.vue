<template>
  <SidebarProvider>
    <AppSidebar v-if="appState.status === 'ok'" class="pt-[1.7rem] box-border" />

    <main class="relative flex w-36 flex-1 flex-col h-screen max-h-screen box-border">
      <div class="h-[1rem] shrink-0"></div>
      <!-- InitQ returned a root path, show app -->
      <template v-if="appState.status === 'ok'">
        <TabsSelector class="shrink-0" />

        <slot />
      </template>

      <div v-else class="flex w-full flex-col items-center justify-center h-[calc(100svh-2rem)]">
        <!-- loading\no root\error -->
        <InitProcess />
      </div>
    </main>
  </SidebarProvider>
</template>

<script setup lang="ts">
import AppSidebar from '~/components/Sidebar/AppSidebar.vue';
import TabsSelector from '~/components/ViewCore/TabsSelector.vue';
import { useIsAppUsable } from '~/composables/queries';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const appState = useIsAppUsable();

const tabsStore = useTabsStoreV2();

const isFirstTab = computed(() => {
  return tabsStore.openedTabs.length >= 1 && tabsStore.openedTabActiveIndex === 0;
});
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
