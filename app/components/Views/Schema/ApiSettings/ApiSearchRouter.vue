<template>
  <IGDBSearch v-if="props.connection.type === 'twitchigdb'" v-model="props.connection" />
</template>

<script lang="ts" setup>
import { type ApiConnection } from '~/composables/useApiConnections';
import IGDBSearch from './IGDBSearch.vue';

const props = defineProps<{
  connection: ApiConnection;
}>();
</script>
