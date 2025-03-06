<template>
  <div class="">
    <h2 class="mb-1 font-semibold">{{ title }}</h2>
    <div class="">
      <div class="currentPath mb-0.5 font-mono text-sm">{{ path ? path : 'Not Set' }}</div>
      <ShButton class="mt-1 w-full" variant="outline" @click="emit('change')">
        {{ path ? 'Change' : 'Set' }}
      </ShButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'change'): void;
}>();
</script>

<style scoped></style>
