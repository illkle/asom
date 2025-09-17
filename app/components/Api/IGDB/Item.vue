<template>
  <img
    v-if="item.cover"
    :src="item.cover"
    class="w-18 h-24 object-cover block rounded-sm overflow-hidden shrink-0"
  />
  <div v-else class="w-18 h-24 block rounded-sm overflow-hidden bg-muted opacity-10"></div>

  <div class="flex flex-col text-left">
    <span class="text">
      {{ item.name }}
    </span>
    <span class="text-regular text-muted-foreground line-clamp-1 text-sm">{{
      item.first_release_date?.getFullYear()
    }}</span>
    <div v-if="item.companies_all" class="text-xs text-muted-foreground line-clamp-1">
      {{ item.companies_all.join(', ') }}
    </div>
    <div v-if="item.platforms" class="text-xs mt-4 text-muted-foreground line-clamp-1">
      {{ item.platforms.join(', ') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IgdbApiGame } from '.';

const props = defineProps<{ item: IgdbApiGame }>();
</script>
