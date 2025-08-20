<template>
  <PageTemplate :data-pending="q.isPending.value">
    <template #title> Api Connection </template>

    <template #header>
      <Select
        v-if="apiData"
        :model-value="apiData.type"
        @update:model-value="(v) => (apiData.type = v as ApiSettings['type'])"
      >
        <SelectTrigger class="mt-2 w-full">
          <SelectValue placeholder="Select an API" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="type in API_Types" :key="type" :value="type">
            {{ type }}
          </SelectItem>
        </SelectContent>
      </Select>
    </template>

    <div v-if="schema.data.value && apiData" class="mt-4 pb-4">
      <IGDB
        v-if="apiData.type === 'twitchigdb'"
        v-model="apiData"
        :schema="schema.data.value.schema"
      />
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import type { ApiSettings } from '~/components/Api/apis';
import { API_Types } from '~/components/Api/apis';
import IGDB from '~/components/Api/IGDB/Settings.vue';
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
