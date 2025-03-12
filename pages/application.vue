<template>
  <template v-if="store.openedItem" class="h-full w-full">
    <template v-if="store.openedItem.type === 'innerPage'"> home page is deprecated </template>
    <template v-else>
      <BookEditor
        v-if="store.openedItem.type === 'file'"
        :opened="store.openedItem"
        :key="store.openedItem.id + '_f'"
      />
      <TableView
        v-else
        :opened="store.openedItem"
        :index="store.openedTabsActiveIndex || 0"
        :key="store.openedItem.id + '_t'"
      />
    </template>
  </template>

  <div v-else class="relative h-full w-full px-2 pr-4">
    <PlaceholdersNoTabPlaceholder />
  </div>
</template>

<script setup lang="ts">
import { debounce as _debounce } from 'lodash';

import { useMainStore } from '~/composables/stores/useMainStore';
import BookEditor from '~/components/Editor/BookEditor.vue';
import TableView from '~/components/BookView/BooksView.vue';

const store = useMainStore();

definePageMeta({
  layout: 'app',
});
</script>

<style></style>
