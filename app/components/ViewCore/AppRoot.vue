<template>
  <SidebarProvider>
    <AppSidebar v-if="appState.status === 'ok' && store.view === 'app'" class="box-border" />

    <main
      class="relative flex w-36 flex-1 flex-col h-screen max-h-screen box-border"
      :class="{ 'bg-background': store.view === 'schemas' }"
    >
      <div class="h-[0.5rem] shrink-0"></div>
      <TabsSelector v-if="store.view === 'app' && appState.status === 'ok'" class="shrink-0" />
      <!-- Editing schemas-->
      <AppSchemaEditorRouter v-if="store.view === 'schemas' && appState.status !== 'noRootPath'" />
      <!-- InitQ returned a root path, show app -->
      <AppTabRouter v-else-if="appState.status === 'ok'" />
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
import AppSidebar from '~/components/ViewCore/AppSidebar.vue';
import AppTabRouter from '~/components/ViewCore/AppTabRouter.vue';
import { useIsAppUsable } from '~/composables/queries';
import { useMainStore } from '~/composables/stores/useMainStore';
import AppSchemaEditorRouter from './AppSchemaEditorRouter.vue';
import InitProcess from './InitProcess.vue';
import TabsSelector from './TabsSelector.vue';

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
