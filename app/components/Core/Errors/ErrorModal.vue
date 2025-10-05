<template>
  <Dialog :open="isError" @update:open="() => (store.errorModal = null)">
    <DialogContent class="z-100">
      <DialogTitle>
        {{ err?.title }}
      </DialogTitle>
      <DialogDescription>
        {{ err?.info }}
      </DialogDescription>
      <DialogDescription>
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
      </DialogDescription>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useMainStore } from '~/composables/stores/useMainStore';
import { useNavigationBlock } from '~/composables/stores/useTabsStoreV2';

const store = useMainStore();

const err = computed(() => store.errorModal);

const isError = computed(() => err.value !== null);
useNavigationBlock(isError);
</script>
