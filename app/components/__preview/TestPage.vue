<template>
  <PageTemplate tab-title="Test Page">
    <Button @click="testFreezeAuto">Test freeze auto</Button>
    <Button @click="test">Test freeze</Button>
    <ListViewWrapper
      v-if="true"
      :key="callsMade"
      :opened="{
        _type: 'folder',
        _path: currentPath ?? 'gamez',
        scrollPositionY: 0,
        scrollPositionX: 0,
        details: {},
      }"
    />
    <TestPageSub v-else :key="callsMade + 'aa'" :path="currentPath ?? 'gamez'" />

    {{ currentPath }}

    {{ callsMade }}
  </PageTemplate>
</template>

<script setup lang="ts">
import TestPageSub from '~/components/__preview/TestPageSub.vue';
import ListViewWrapper from '~/components/Views/List/ListViewWrapper.vue';
import PageTemplate from '../Views/Schema/common/PageTemplate.vue';

const callsMade = ref(0);

const possiblePaths = ['gamez', 'movies', 'books-next', 'test'];
const currentPath = ref(possiblePaths[0]);

const testFreezeAuto = async () => {
  setInterval(() => {
    test();
  }, 100);
};

const test = async () => {
  callsMade.value++;
  currentPath.value = possiblePaths[callsMade.value % possiblePaths.length];
};
</script>
