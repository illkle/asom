<template>
  <ShDialog :open="err ? true : false" @update:open="() => (store.errorModal = null)">
    <ShDialogContent>
      <ShDialogTitle>
        {{ err?.title }}
      </ShDialogTitle>
      <ShDialogDescription>
        {{ err?.info }}
      </ShDialogDescription>
      <ShDialogDescription>
        <div v-if="err?.rawError">
          {{ err?.rawError }}
        </div>
        <div v-if="err?.subErrors && err.subErrors.length">
          <div v-for="se in err.subErrors">
            <div v-if="se.title" class="bold">
              {{ se.title }}
            </div>
            <div v-if="se.rawError" class="bold">
              {{ se.rawError }}
            </div>
          </div>
        </div>
      </ShDialogDescription>
    </ShDialogContent>
  </ShDialog>
</template>

<script setup lang="ts">
import { useMainStore } from '~/composables/stores/useMainStore';

const store = useMainStore();

const err = computed(() => store.errorModal);
</script>
