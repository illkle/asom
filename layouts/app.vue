<template>
  <ShSidebarProvider class="bg-neutral-200 dark:bg-neutral-900">
    <Sidebar v-if="appState.status === 'ok'" class="pt-[2rem]" />
    <main
      :class="[
        'relative flex w-36 flex-1 flex-col',
        //'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2',
      ]"
    >
      <!-- InitQ returned a root path, show app -->
      <template v-if="appState.status === 'ok'">
        <TabsSelector />

        <div
          class="overscroll-none scrollbarMod gutter-stable h-full bg-neutral-100 dark:bg-neutral-950"
        >
          <slot />
        </div>
      </template>

      <div v-else class="flex w-full flex-col items-center justify-center h-[calc(100svh-2rem)]">
        <!-- loading\no root\error -->
        <InitProcess />
      </div>
    </main>
  </ShSidebarProvider>
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
