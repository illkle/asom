<template>
  <PageTemplate :data-pending="q.isPending.value">
    <div class="flex items-center justify-between">
      <h1 class="mb-4 font-serif text-3xl">Api Connection</h1>
    </div>

    <div>Select api to connect to this schema:</div>

    <Select
      v-if="apiData"
      :model-value="apiData.type"
      @update:model-value="(v) => (apiData.type = v as ApiSettings['type'])"
    >
      <SelectTrigger class="mt-4">
        <SelectValue placeholder="Select an API" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="type in API_Types" :key="type" :value="type">
          {{ type }}
        </SelectItem>
      </SelectContent>
    </Select>

    <div v-if="schema.data.value && apiData" class="mt-4">
      <IGDB
        v-if="apiData.type === 'twitchigdb'"
        v-model="apiData"
        :schema="schema.data.value.schema"
      />
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import IGDB from '~/components/Api/IGDB/Settings.vue';
import type { ApiSettings } from '~/components/Api/apis';
import { API_Types } from '~/components/Api/apis';
import type { IOpened } from '~/composables/stores/useTabsStoreV2';
import PageTemplate from './PageTemplate.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const schema = useSchemaByPath(computed(() => props.opened._path));

const { editableData: apiData, q } = useApiConnection(computed(() => props.opened._path));
</script>
