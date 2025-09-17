<template>
  <img
    v-if="item.cover_low_quality"
    :src="item.cover_low_quality"
    class="w-18 h-27 object-cover block rounded-sm overflow-hidden shrink-0"
  />
  <div v-else class="w-18 h-27 block rounded-sm overflow-hidden bg-muted opacity-10"></div>

  <div class="flex flex-col text-left">
    <span class="text-lg">
      {{ item.title }}
    </span>
    <span class="text-regular text-muted-foreground">{{ item.year }}</span>
    <div class="text-sm text-muted-foreground">{{ item.author_name?.join(', ') }}</div>
  </div>
</template>

<script setup lang="ts">
import type { OpenLibraryApiBook } from '.';

const props = defineProps<{
  item: OpenLibraryApiBook;
}>();
</script>
