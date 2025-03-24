<template>
  <template v-if="tabsStore.openedItem" class="h-full w-full">
    <template v-if="tabsStore.openedItem.type === 'innerPage'"> home page is deprecated </template>
    <template v-else>
      <RecordEditor
        v-if="tabsStore.openedItem.type === 'file'"
        :opened="tabsStore.openedItem"
        :key="tabsStore.openedItem.id + '_f'"
      />
      <TableView
        v-else
        :opened="tabsStore.openedItem"
        :index="tabsStore.openedTabsActiveIndex || 0"
        :key="tabsStore.openedItem.id + '_t'"
      />
    </template>
  </template>

  <div v-else class="relative h-full w-full px-2 pr-4">
    <PlaceholdersNoTabPlaceholder />
  </div>
</template>

<script setup lang="ts">
import TableView from '~/components/BookView/BooksView.vue';
import RecordEditor from '~/components/Editor/RecordEditor.vue';
import { useTabsStore } from '~/composables/stores/useTabsStore';

const tabsStore = useTabsStore();

definePageMeta({
  layout: 'app',
});
</script>

<style></style>
