<template>
  <div>
    <Input v-model="modelValue.a.text" />

    sub sub

    <SubSub v-model="modelValue.a" />
  </div>
</template>

<script setup lang="ts">
import SubSub from './SubSub.vue';

defineModel<{
  a: {
    text: string;
  };
}>();
</script>
