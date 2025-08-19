<template>
  <IGDBSearch
    v-if="props.connection.type === 'twitchigdb'"
    v-model="props.connection"
    @select="
      (v) => {
        if (props.connection.type !== 'twitchigdb') return;
        emit('select', v.name, makeFileAttrsFromApi(props.connection, v, props.connection.mapping));
      }
    "
  />
</template>

<script lang="ts" setup>
import type { ApiSettings } from '~/components/Api/apis';
import { makeFileAttrsFromApi } from '~/components/Api/apis';
import IGDBSearch from '~/components/Api/IGDB/Search.vue';
import type { RecordFromDb } from '~/types';

const props = defineProps<{
  connection: ApiSettings;
}>();

const emit = defineEmits<{
  (e: 'select', id: string, game: RecordFromDb['attrs']): void;
}>();
</script>
