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
import { getGamesFromIGDB, igdbAPISchema, type ApiSettingsIGDB } from '~/api/external/igb';
import IGDBSearch from '~/components/SchemaEditor/ApiSettings/IGDBSearch.vue';
import MappingSelector from '~/components/SchemaEditor/ApiSettings/MappingSelector.vue';
import type { Schema } from '~/types';

const props = defineProps<{
  schema: Schema;
}>();

const data = defineModel<ApiSettingsIGDB>();

const testStatus = ref<'unknown' | 'success' | 'error'>('unknown');

const onTestConnection = async () => {
  if (!data.value.clientId || !data.value.clientSecret) {
    useRustErrorNotification({
      isError: true,
      title: 'Client ID and client secret are required',
      subErrors: [],
    });
    return;
  }

  const games = await getGamesFromIGDB({
    token: data.value.accessToken ?? '',
    clientId: data.value.clientId,
    clientSecret: data.value.clientSecret,
    name: 'Witcher',
    limit: 10,
    saveToken: (token) => (data.value.accessToken = token),
  });

  if (games.length > 0) {
    testStatus.value = 'success';
  } else {
    testStatus.value = 'error';
  }
};
</script>
