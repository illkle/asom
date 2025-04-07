<template>
  <SidebarProvider>
    <AppSidebar v-if="appState.status === 'ok'" class="pt-[2rem] box-border" />

    <main class="relative flex w-36 flex-1 flex-col h-screen box-border pt-[1rem]">
      <!-- InitQ returned a root path, show app -->
      <template v-if="appState.status === 'ok'">
        <div class="">
          <TabsSelector />
        </div>
        <div
          ref="scrollElementRef"
          class="overscroll-none scrollbarMod gutter-stable h-full bg-background transition-all duration-100"
          :class="isFirstTab ? '' : 'rounded-tl-md'"
        >
          <slot />
        </div>
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
import { useTabsStore } from '~/composables/stores/useTabsStore';

const appState = useIsAppUsable();

const tabsStore = useTabsStore();

const isFirstTab = computed(() => {
  return tabsStore.openedTabs.length >= 1 && tabsStore.openedTabsActiveIndex === 0;
});

const scrollElementRef = useTemplateRef<HTMLDivElement>('scrollElementRef');
provide('scrollElementRef', scrollElementRef);
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
