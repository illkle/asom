<template>
  <div class="flex flex-col gap-2 mx-auto px-4 w-full py-10 max-w-5xl">
    <div class="grid grid-cols-2 dense">
      <div class="w-[400px] h-[500px] bg-amber-100"></div>
      <div class="w-[400px] h-[200px] bg-amber-200"></div>
      <div class="w-[400px] col-start-2 h-[200px] bg-amber-300"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import z from 'zod';

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
