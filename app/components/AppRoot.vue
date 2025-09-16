<template>
  <SidebarProvider>
    <AppSidebar v-if="appState.status === 'ok' && store.view === 'app'" class="box-border" />

    <main
      class="relative flex w-36 flex-1 flex-col h-screen max-h-screen box-border"
      :class="{ 'bg-background': store.view === 'schemas' }"
    >
      <div class="shrink-0 flex justify-between gap-2">
        <div class="pt-[0.5rem] flex-1">
          <TabsSelector v-if="appState.status === 'ok'" />
        </div>
        <div v-if="!isMac" class="h-full flex">
          <button
            size="icon"
            class="flex w-12 items-center justify-center h-full rounded-none bg-transparent text-foreground hover:bg-muted-foreground/20"
          >
            <MinusIcon class="w-3 h-3" />
          </button>
          <button
            size="icon"
            class="flex w-12 items-center justify-center h-full rounded-none bg-transparent text-foreground hover:bg-muted-foreground/20"
          >
            <SquareIcon class="w-3 h-3" />
          </button>
          <button
            size="icon"
            class="flex w-12 shadow-none items-center justify-center h-full rounded-none bg-transparent hover:bg-red-500 hover:text-white text-foreground"
          >
            <XIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <!-- InitQ returned a root path, show app -->
      <RouterMain v-if="appState.status === 'ok'" />
      <!-- loading\no root\error -->
      <div v-else class="flex w-full flex-col items-center justify-center h-[calc(100svh-2rem)]">
        <div class="bg-background rounded-md p-4">
          <InitProcess />
        </div>
      </div>
    </main>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { MinusIcon, SquareIcon, XIcon } from 'lucide-vue-next';
import { useIsAppUsable } from '~/composables/queries';
import { useMainStore } from '~/composables/stores/useMainStore';
import AppSidebar from './Core/AppSidebar.vue';
import InitProcess from './Core/InitProcess.vue';
import TabsSelector from './Core/Tabs/TabsSelector.vue';
import RouterMain from './RouterMain.vue';
const appState = useIsAppUsable();

const store = useMainStore();

watch(
  appState,
  (v) => {
    if (v.status === 'noRootPath') {
      store.setView('app');
    }
  },
  { immediate: true },
);

const isMac = useIsMac();
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
