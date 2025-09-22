<template>
  <h4 class="text-lg font-serif mt-4 mb-2">Mapping</h4>

  <MappingSelector
    v-if="apiConnectionData.q.data.value"
    v-model:mapping="apiConnectionData.q.data.value.mapping"
    :schema="schema"
    :api-schema="igdbAPISchema"
    @setByKey="
      (key, mapping) =>
        apiConnectionData.mutateUpdater((vv) => {
          vv.mapping[key] = mapping;
          return vv;
        })
    "
    @deleteByKey="
      (key) =>
        apiConnectionData.mutateUpdater((vv) => {
          delete vv.mapping[key];
          return vv;
        })
    "
    @updateModeByKey="
      (key, v) =>
        apiConnectionData.mutateUpdater((vv) => {
          vv.mapping[key]!.mode = v;
          return vv;
        })
    "
  />
</template>

<script setup lang="ts">
import MappingSelector from '~/components/Api/common/MappingSelector.vue';
import { igdbAPISchema } from '~/components/Api/IGDB';
import type { ApiSettingsComponentProps } from '../common/apiTypes';

const props = defineProps<ApiSettingsComponentProps>();
</script>
