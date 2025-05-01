<template>
  <template v-if="tabsStore.openedItem" class="h-full w-full">
    <template v-if="tabsStore.openedItem._type === 'innerPage'">
      <ToolsGoodreadsImporter v-if="tabsStore.openedItem._path === 'goodreadsImporter'" />
    </template>
    <template v-else>
      <RecordEditor
        v-if="tabsStore.openedItem._type === 'file'"
        :opened="tabsStore.openedItem"
        :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'file'"
      />
      <BooksViewWrapper
        v-else-if="tabsStore.openedItem._type === 'folder'"
        :opened="tabsStore.openedItem"
        :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'table'"
      />
    </template>
  </template>

  <div v-else class="relative h-full w-full px-2 pr-4">
    <PlaceholdersNoTabPlaceholder />
  </div>
</template>

<script setup lang="ts">
import BooksViewWrapper from '~/components/BookView/BookViewWrapper.vue';
import RecordEditor from '~/components/Editor/RecordEditor.vue';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const tabsStore = useTabsStoreV2();

definePageMeta({
  layout: 'app',
});
</script>

<style></style>
