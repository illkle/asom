<template>
  <div>{{ err.info }}</div>
  <ShButton v-if="err.rawError" size="xs" variant="outline" class="mt-2" @click="readFullError">
    Show raw error message
  </ShButton>
</template>

<script setup lang="ts">
import type { ErrFR } from '~/types';
import { useMainStore } from '~/composables/stores/useMainStore';

const store = useMainStore();

const readFullError = () => {
  store.setError(props.err);
};

const props = defineProps({
  err: {
    type: Object as PropType<ErrFR>,
    default: 'no prop',
  },
});
</script>
