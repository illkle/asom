<template>
  <div>
    <Input v-model="modelValue.text" />
  </div>
</template>

<script setup lang="ts">
defineModel<{
  text: string;
}>();
</script>
