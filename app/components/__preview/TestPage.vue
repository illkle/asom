<template>
  <PageTemplate>
    <Button @click="handleClick"> texterror </Button>
  </PageTemplate>
</template>

<script setup lang="ts">
const input = ref('Test');
import PageTemplate from '../Views/Schema/common/PageTemplate.vue';

const handleClick = () => {
  useRustErrorNotification({
    title: 'Test error',
    info: 'Test error',
    isError: true,
    subErrors: [],
  });
  throw new Error('Test error');
};
</script>
