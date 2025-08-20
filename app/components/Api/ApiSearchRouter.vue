<template>
  <IGDBSearch
    v-if="props.connection.type === 'twitchigdb'"
    v-model="props.connection"
    @select="
      async (v) => {
        if (props.connection.type !== 'twitchigdb') return;
        emit(
          'select',
          v.name,
          await makeFileAttrsFromApi(
            props.connection,
            v,
            props.connection.mapping,
            rootPath.data.value,
            v.name,
          ),
        );
      }
    "
  />
</template>

<script lang="ts" setup>
import type { ApiSettings } from '~/components/Api/apis';
import { makeFileAttrsFromApi } from '~/components/Api/apis';
import IGDBSearch from '~/components/Api/IGDB/Search.vue';
import type { RecordFromDb } from '~/types';

const rootPath = useRootPath();

const props = defineProps<{
  connection: ApiSettings;
}>();

const emit = defineEmits<{
  (e: 'select', id: string, record: RecordFromDb['attrs']): void;
}>();
</script>
