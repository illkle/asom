<template>
  <div data-tauri-drag-region class="h-[2rem] w-full bg-neutral-200 dark:bg-neutral-900"></div>

  <ShSidebarProvider class="bg-neutral-200 dark:bg-neutral-900">
    <Sidebar class="pt-[2rem]" />
    <main
      :class="[
        'h-[calc(100svh-2rem)]',
        'relative flex w-36 flex-1 flex-col',
        'bg-neutral-100 dark:bg-neutral-950',
        'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow',
      ]"
    >
      <div class="col-span-2 box-border h-10 bg-neutral-200 dark:bg-neutral-900">
        <TabsSelector />
      </div>

      <div class="gutter-stable h-[calc(100svh_-_2.5rem)] overscroll-none">
        <slot />
      </div>
    </main>
  </ShSidebarProvider>
</template>

<script setup lang="ts">
import Sidebar from '~/components/Sidebar/Sidebar.vue';
import TabsSelector from '~/components/ViewCore/TabsSelector.vue';

const store = useStore();

// Root Path loading Logic
watch(
  () => store.rootPath,
  async () => {
    if (typeof store.rootPath !== 'string') {
      await navigateTo('/welcome');
      return;
    }
    await store.fetchSetting();
    await store.fetchOpened();
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
