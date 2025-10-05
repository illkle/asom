<template>
  <div>
    <div>{{ err.info }}</div>
    <Button v-if="err.rawError" size="sm" variant="outline" class="mt-2" @click="readFullError">
      Show raw error message
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '~/composables/stores/useMainStore';
import type { ErrFR } from '~/types';

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
