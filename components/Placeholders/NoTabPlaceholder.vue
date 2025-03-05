<template>
  <div class="flex flex-col items-center justify-center pt-40">
    <div>You have nothing opened.</div>
    <div class="mt-4 flex gap-4">
      <ShButton variant="outline" @click="openAllBooks">View All Books</ShButton>
      <IconsMenuBookAdder>
        <ShButton variant="outline">Add New Book</ShButton>
      </IconsMenuBookAdder>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';
import { rustErrorNotification } from '~/api/tauriEvents';

const store = useStore();

const r = useRouter();

const openAllBooks = () => {
  if (!store.rootPath) {
    throw new Error('NoTabPlaceholder handler: no root path');
  }

  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'folder',
      thing: store.rootPath,
      scrollPosition: 0,
      settings: getDefaultViewSettings(),
      recursive: true,
    },
    { place: 'current', focus: true },
  );
};
</script>

<style scoped></style>
