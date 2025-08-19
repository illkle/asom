<template>
  <template v-if="tabsStore.openedItem" class="h-full w-full">
    <NuxtErrorBoundary
      :key="tabsStore.openedItem._path"
      @error="
        (e) => {
          console.error(e);
        }
      "
    >
      <template #error="{ error }">
        <div class="p-12 mx-auto text-center w-full h-full bg-background">
          <p class="text-lg font-bold">Error when rendering UI</p>
          <p class="text-sm text-muted-foreground">{{ error }}</p>
        </div>
      </template>
      <template #default>
        <template v-if="tabsStore.openedItem._type === 'innerPage'">
          <GoodreadsImporter v-if="tabsStore.openedItem._path === 'goodreadsImporter'" />
        </template>
        <template v-else>
          <RecordEditor
            v-if="tabsStore.openedItem._type === 'file'"
            :opened="tabsStore.openedItem"
            :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'file'"
            :class="{ 'rounded-tl': !isFirstTab }"
          />
          <ListViewWrapper
            v-else-if="tabsStore.openedItem._type === 'folder'"
            :opened="tabsStore.openedItem"
            :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'table'"
            :class="{ 'rounded-tl': !isFirstTab }"
          />
        </template>
      </template>
    </NuxtErrorBoundary>
  </template>

  <div v-else class="relative h-full w-full px-2 pr-4">
    <div class="flex flex-col items-center justify-center h-full">
      <div class="text-muted-foreground">You have nothing opened</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoodreadsImporter from '~/components/Api/Goodreads/GoodreadsImporter.vue';
import RecordEditor from '~/components/Views/Editor/RecordEditor.vue';
import ListViewWrapper from '~/components/Views/List/ListViewWrapper.vue';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const tabsStore = useTabsStoreV2();

const isFirstTab = computed(() => {
  return tabsStore.openedTabActiveIndex === 0;
});
</script>

<style></style>
