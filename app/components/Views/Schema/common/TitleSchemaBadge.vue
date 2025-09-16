<template>
  <Button v-if="schema" @click="goToSchemas" variant="outline" size="sm" class="-translate-y-1">
    Schema: {{ schema.name }}
  </Button>
</template>

<script setup lang="ts">
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import type { Schema } from '~/types';

const props = defineProps<{
  schema: Schema | undefined;
}>();

const schema = computed(() => props.schema);

const ts = useTabsStoreV2();

const goToSchemas = () => {
  ts.openNewThingFast({ _type: 'settings', _path: '' });
};
</script>
