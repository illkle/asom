<template>
  <IGDBSearch
    v-if="props.connection.type === 'twitchigdb'"
    v-model="props.connection"
    @select="
      async (v) => {
        if (props.connection.type !== 'twitchigdb') return;
        if (!v.name || !rootPath.data.value) return;
        const attrs = await makeFileAttrsFromApi({
          apiSettings: props.connection,
          apiData: v,
          schema: props.schema,
          context: { rootPath: rootPath.data.value, recordName: v.name },
        });
        console.log('attrs', attrs);
        emit('select', v.name, attrs);
      }
    "
  />
</template>

<script lang="ts" setup>
import type { ApiSettings } from '~/components/Api/apis';
import IGDBSearch from '~/components/Api/IGDB/Search.vue';
import type { RecordFromDb, Schema } from '~/types';
import { makeFileAttrsFromApi } from './makeFileFromApi';

const rootPath = useRootPath();

const props = defineProps<{
  connection: ApiSettings;
  schema: Schema;
}>();

const emit = defineEmits<{
  (e: 'select', id: string, record: RecordFromDb['attrs']): void;
}>();
</script>
