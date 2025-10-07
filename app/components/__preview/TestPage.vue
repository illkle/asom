<template>
  <PageTemplate tab-title="Test Page">
    {{ aa }}
  </PageTemplate>
</template>

<script setup lang="ts">
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

const aa = import.meta.env;
</script>
