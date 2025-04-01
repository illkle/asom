<template>
  <div class="flex flex-col items-center justify-center pt-40">
    <div class="text-center">You don't have any files {{ isRootOpened ? 'yet' : 'here' }}.</div>
    <div class="mt-4 flex gap-4">
      <Button variant="outline" @click="openAllBooks">View All Books</Button>

      <Button variant="outline">Add New Book</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getDefaultViewSettings, useTabsStore } from '~/composables/stores/useTabsStore';

const ts = useTabsStore();

const rootPath = useRootPath();

const isRootOpened = ts.openedItem?.thing === rootPath.data.value;

const openAllBooks = () => {
  if (!rootPath.data.value) {
    throw new Error('NoTabPlaceholder handler: no root path');
  }

  ts.openNewOne(
    {
      id: ts.generateRandomId(),
      type: 'folder',
      thing: rootPath.data.value,
      scrollPosition: 0,
      settings: getDefaultViewSettings(),
      recursive: true,
    },
    { place: 'current', focus: true },
  );
};
</script>

<style scoped></style>
