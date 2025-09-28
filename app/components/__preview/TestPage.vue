<template>
  <PageTemplate>
    <Input v-model="input" />
    <TestPageSub />
  </PageTemplate>
</template>

<script setup lang="ts">
const input = ref('Test');
import Input from '../ui/input/Input.vue';
import PageTemplate from '../Views/Schema/common/PageTemplate.vue';
import TestPageSub from './TestPageSub.vue';

provide('hello', input);
</script>
