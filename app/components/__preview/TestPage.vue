<template>
  <PageTemplate tab-title="Test Page">
    <Button @click="test">Test freeze</Button>
    <TestPageSub :key="callsMade" :path="currentPath ?? 'gamez'" />

    {{ currentPath }}

    {{ callsMade }}
  </PageTemplate>
</template>

<script setup lang="ts">
const input = ref('Test');
import TestPageSub from '~/components/__preview/TestPageSub.vue';
import PageTemplate from '../Views/Schema/common/PageTemplate.vue';

const callsMade = ref(0);

const possiblePaths = ['gamez', 'movies', 'books-next', 'test'];
const currentPath = ref(possiblePaths[0]);

const test = async () => {
  callsMade.value++;
  currentPath.value = possiblePaths[callsMade.value % possiblePaths.length];
};
</script>
