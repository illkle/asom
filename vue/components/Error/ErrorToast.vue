<template>
  <div>{{ err.info }}</div>
  <ShButton v-if="err.rawError" size="xs" variant="outline" class="mt-2" @click="readFullError">
    Show raw error message
  </ShButton>
</template>

<script setup lang="ts">
import type { ErrorFromRust } from '~/api/tauriEvents';

const store = useStore();

const readFullError = () => {
  store.setError(props.err);
};

const props = defineProps({
  err: {
    type: Object as PropType<ErrorFromRust>,
    default: 'no prop',
  },
});
</script>
