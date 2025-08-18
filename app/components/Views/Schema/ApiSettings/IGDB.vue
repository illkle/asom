<template>
  <div class="flex gap-4">
    <div>
      <div>Client ID</div>
      <Input v-model="data.clientId" />
    </div>
    <div>
      <div>Client secret</div>
      <Input v-model="data.clientSecret" />
    </div>
  </div>

  <div class="mt-2" v-if="data.clientId && data.clientSecret">
    <IGDBSearch v-model="data" />
  </div>

  <h4 class="text-lg font-serif mt-4 mb-2">Mapping</h4>

  <MappingSelector v-model:mapping="data.mapping" :schema="schema" :api-schema="igdbAPISchema" />
</template>

<script setup lang="ts">
import { igdbAPISchema, type ApiSettingsIGDB } from '~/api/external/igb';
import IGDBSearch from '~/components/Views/Schema/ApiSettings/IGDBSearch.vue';
import MappingSelector from '~/components/Views/Schema/ApiSettings/MappingSelector.vue';
import type { Schema } from '~/types';

const props = defineProps<{
  schema: Schema;
}>();

const data = defineModel<ApiSettingsIGDB>();
</script>
