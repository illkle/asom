<template>
  <PageTemplate :data-pending="apiConnectionData.q.isPending.value" tab-title="Api Connection">
    <template #title> Api Connection </template>
    <template #title-badge>
      <TitleSchemaBadge :schema="schema.data.value?.schema" />
    </template>

    <template #header>
      <Select
        v-if="apiConnectionData.q.data.value"
        :model-value="apiConnectionData.q.data.value?.type"
        @update:model-value="
          (v) => {
            apiConnectionData.mutateUpdater((vv) => {
              vv.type = v as ApiSettings['type'];
              return vv;
            });
          }
        "
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

    <div v-if="schema.data.value && apiConnectionData.q.data.value" class="">
      <IGDBSettings
        v-if="apiConnectionData.q.data.value.type === 'twitchigdb'"
        :api-connection-data="apiConnectionData"
        :schema="schema.data.value.schema"
      />
      <OpenLibrarySettings
        v-if="apiConnectionData.q.data.value.type === 'openlibrary'"
        :api-connection-data="apiConnectionData"
        :schema="schema.data.value.schema"
      />
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import type { ApiSettings } from '~/components/Api/apis';
import { API_Types } from '~/components/Api/apis';
import IGDBSettings from '~/components/Api/IGDB/Settings.vue';
import OpenLibrarySettings from '~/components/Api/OpenLibrary/Settings.vue';
import PageTemplate from '~/components/Views/Schema/common/PageTemplate.vue';
import TitleSchemaBadge from '~/components/Views/Schema/common/TitleSchemaBadge.vue';
import type { IOpened } from '~/composables/stores/useTabsStoreV2';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const schema = useSchemaByPath(computed(() => props.opened._path));

const apiConnectionData = useApiConnection(computed(() => props.opened._path));
</script>
