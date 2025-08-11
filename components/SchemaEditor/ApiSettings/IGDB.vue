<template>
  <div class="flex gap-4">
    <div>
      <div>Client ID</div>
      <Input
        :model-value="data.clientId"
        @update:model-value="(v) => emit('update', { ...data, clientId: String(v) })"
      />
    </div>
    <div>
      <div>Client secret</div>
      <Input
        :model-value="data.clientSecret"
        @update:model-value="(v) => emit('update', { ...data, clientSecret: String(v) })"
      />
    </div>
  </div>

  <div class="flex items-center gap-2 mt-4">
    <Button variant="outline" @click="onTestConnection">Test connection</Button>

    <div class="border rounded-md p-1">
      <FileQuestionIcon v-if="testStatus === 'unknown'" />
      <CheckIcon v-if="testStatus === 'success'" />
      <XIcon v-if="testStatus === 'error'" />
    </div>
  </div>

  <h4 class="text-lg font-serif mt-4 mb-2">Mapping</h4>

  <MappingSelector
    :schema="schema"
    :api-schema="igdbAPISchema"
    :mapping="data.mapping ?? {}"
    @update:mapping="
      (v) => {
        emit('update', { ...data, mapping: v });
      }
    "
  />
</template>

<script setup lang="ts">
import { CheckIcon, FileQuestionIcon, XIcon } from 'lucide-vue-next';
import { getGamesFromIGDB, igdbAPISchema, type ApiSettingsIGDB } from '~/api/external/igb';
import MappingSelector from '~/components/SchemaEditor/ApiSettings/MappingSelector.vue';
import type { Schema } from '~/types';

const props = defineProps<{
  data: ApiSettingsIGDB;
  schema: Schema;
}>();

const mapping = ref<Record<keyof typeof igdbAPISchema, string | undefined>>({});

const emit = defineEmits<{
  (e: 'update', data: ApiSettingsIGDB): void;
}>();

const testStatus = ref<'unknown' | 'success' | 'error'>('unknown');

const onTestConnection = async () => {
  if (!props.data.clientId || !props.data.clientSecret) {
    useRustErrorNotification({
      isError: true,
      title: 'Client ID and client secret are required',
      subErrors: [],
    });
    return;
  }

  const games = await getGamesFromIGDB({
    token: props.data.accessToken ?? '',
    clientId: props.data.clientId,
    clientSecret: props.data.clientSecret,
    name: 'Witcher',
    limit: 10,
    saveToken: (token) => emit('update', { ...props.data, accessToken: token }),
  });

  if (games.length > 0) {
    testStatus.value = 'success';
  } else {
    testStatus.value = 'error';
  }
};
</script>
