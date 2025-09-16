<template>
  <div class="flex h-full flex-col justify-center p-4" v-if="query.data.value === null">
    <div class="text-2xl font-serif">To begin please set root path</div>
    <div class="text-xs text-muted-foreground mt-1">Your files & settings will be saved there.</div>
    <Button class="mt-4" @click="selectAndSetRootPath" variant="outline"> Set Root Path </Button>
  </div>
</template>

<script lang="ts" setup>
import { selectAndSetRootPath } from '~/api/rootPath';
import { useMainStore } from '~/composables/stores/useMainStore';

const props = defineProps<{
  query: ReturnType<typeof useRootPath>;
}>();

const store = useMainStore();
</script>
