<template>
  <div>
    {{ val }}
  </div>
</template>

<script setup lang="ts">
const val = inject('hello');
</script>
