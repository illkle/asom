<template>
  <div class="flex flex-col gap-2 mx-auto px-4 w-full py-10 max-w-5xl">
    <TestComponentKitTestComponent v-if="false" />
    <div class="h-[300px]"></div>
    <TestComponent />
  </div>
</template>

<script setup lang="ts">
import z from 'zod';
import TestComponent from '~/components/TestComponent/TestComponent.vue';

definePageMeta({
  layout: 'empty',
});

const zGroup = z.interface({
  name: z.string(),
  get subcategories() {
    return z.array(zGroup.or(z.string()));
  },
});

type IGroup = z.infer<typeof zGroup>;

const rootGroup: IGroup = {
  name: 'root',
  subcategories: [],
};
</script>

<style scoped>
.dense {
  grid-auto-flow: dense;
}
</style>
