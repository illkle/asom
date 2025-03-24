<template>
  <div data-tauri-drag-region class="h-[2rem] w-full bg-neutral-200 dark:bg-neutral-900"></div>

  <!-- InitQ returned a root path, show app -->
  <template v-if="appState.status === 'ok'">
    <ShSidebarProvider class="bg-neutral-200 dark:bg-neutral-900">
      <Sidebar class="pt-[2rem]" />
      <main
        :class="[
          'relative flex w-36 flex-1 flex-col',
          //  'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2',
        ]"
      >
        <div class="col-span-2 py-4 box-border h-10 bg-neutral-200 dark:bg-neutral-900">
          <TabsSelector />
        </div>

        <div class="gutter-stable scrollbarMod overscroll-none bg-neutral-100 dark:bg-neutral-950">
          <slot />
        </div>
      </main>
    </ShSidebarProvider>
  </template>

  <main v-else class="flex w-full flex-col items-center justify-center h-[calc(100svh-2rem)]">
    <!-- loading\no root\error -->
    <InitProcess />
  </main>
</template>

<script setup lang="ts">
import TabsSelector from '~/components/ViewCore/TabsSelector.vue';
import { useIsAppUsable } from '~/composables/queries';

const appState = useIsAppUsable();
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
