<template>
  <div class="flex h-full flex-col items-center justify-center p-10">
    <div class="text-2xl">To begin please set working directory</div>
    <div class="text-xs">Your files & settings will be store there.</div>
    <ShButton variant="default" class="mt-4" @click="changeRootPathHandler">
      Set Working Directory
    </ShButton>
  </div>
</template>

<script lang="ts" setup>
import { selectAndSetRootPath } from '~/api/rootPath';

const changeRootPathHandler = async () => {
  await selectAndSetRootPath();
};

definePageMeta({
  layout: 'empty',
});
</script>
