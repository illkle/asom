<template>
  <template v-if="tabsStore.openedItem" class="h-full w-full">
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

  <div v-else class="relative h-full w-full px-2 pr-4">
    <div class="flex flex-col items-center justify-center h-full">
      <div class="text-muted-foreground">You have nothing opened</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoodreadsImporter from '~/components/Modules/GoodreadsImporter.vue';
import RecordEditor from '~/components/Views/Editor/RecordEditor.vue';
import ListViewWrapper from '~/components/Views/List/ListViewWrapper.vue';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const tabsStore = useTabsStoreV2();

const isFirstTab = computed(() => {
  return tabsStore.openedTabActiveIndex === 0;
});
</script>

<style></style>
