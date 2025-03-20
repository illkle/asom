<template>
  <div class="flex flex-col items-center justify-center pt-40">
    <div class="text-center">You don't have any files {{ isRootOpened ? 'yet' : 'here' }}.</div>
    <div class="mt-4 flex gap-4">
      <ShButton variant="outline" @click="openAllBooks">View All Books</ShButton>

      <ShButton variant="outline">Add New Book</ShButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTabsStore } from '~/composables/stores/useTabsStore';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';

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
