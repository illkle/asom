<template>
  <div class="relative min-h-4" :class="$attrs.class">
    <IGDBSearch
      v-if="props.connection.type === 'twitchigdb'"
      v-model="props.connection"
      :search="debouncedSearch"
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
    <OpenLibrarySearch
      v-if="props.connection.type === 'openlibrary'"
      v-model="props.connection"
      :search="debouncedSearch"
      @select="
        async (v) => {
          if (props.connection.type !== 'openlibrary') return;
          if (!v.title || !rootPath.data.value) return;
          const attrs = await makeFileAttrsFromApi({
            apiSettings: props.connection,
            apiData: v,
            schema: props.schema,
            context: { rootPath: rootPath.data.value, recordName: v.title },
          });
          console.log('attrs', attrs);
          emit('select', v.title, attrs);
        }
      "
    />

    <div
      class="text-xs text-right text-muted-foreground bg-background border fixed bottom-0 right-0 rounded-tl border-r-0 border-b-0 px-1 py-0.5 opacity-50"
    >
      {{ props.connection.type }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useDebounce } from '@vueuse/core';
import type { ApiSettings } from '~/components/Api/apis';
import IGDBSearch from '~/components/Api/IGDB/Results.vue';
import OpenLibrarySearch from '~/components/Api/OpenLibrary/Results.vue';
import type { RecordFromDb, Schema } from '~/types';
import { makeFileAttrsFromApi } from './makeFileFromApi';

const rootPath = useRootPath();

const props = defineProps<{
  connection: ApiSettings;
  schema: Schema;
  search: string;
}>();

const emit = defineEmits<{
  (e: 'select', id: string, record: RecordFromDb['attrs']): void;
}>();

const debouncedSearch = useDebounce(
  computed(() => props.search),
  200,
);
</script>
