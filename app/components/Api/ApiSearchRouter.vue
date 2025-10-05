<template>
  <div class="relative min-h-4" :class="$attrs.class">
    <IGDBSearch
      v-if="props.connection.type === 'twitchigdb'"
      v-model="props.connection"
      :search="debouncedSearch"
      @select="
        async (v) => {
          if (props.connection.type !== 'twitchigdb') return;
          if (!v.name) return;
          emit('select', {
            apiSettings: props.connection,
            apiData: v,
            schema: props.schema,
            recordName: v.name,
          });
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
          if (!v.title) return;
          emit('select', {
            apiSettings: props.connection,
            apiData: v,
            schema: props.schema,
            recordName: v.title,
          });
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
import { useRootPathInjectSafe } from '~/composables/data/providers';
import type { Schema } from '~/types';
import { type APIEmitData } from './makeFileFromApi';

const rootPath = useRootPathInjectSafe();

const props = defineProps<{
  connection: ApiSettings;
  schema: Schema;
  search: string;
}>();

const emit = defineEmits<{
  (e: 'select', data: APIEmitData<ApiSettings>): void;
}>();

const debouncedSearch = useDebounce(
  computed(() => props.search),
  200,
);
</script>
