<template>
  <ResultGeneric :query="q" @select="(v) => emits('select', v)">
    <template #item="{ item }">
      <Item :item="item" />
    </template>
  </ResultGeneric>
</template>

<script lang="ts" setup>
import type { ApiSettingsOpenLibrary, OpenLibraryApiBook } from '.';
import ResultGeneric from '../common/ResultGeneric.vue';
import Item from './Item.vue';
import { getBooksFromOpenLibrary } from './openlibrary';

const data = defineModel<ApiSettingsOpenLibrary>();

const props = defineProps<{
  search: string;
}>();

const q = useQuery({
  key: () => ['openlibrary', 'search', props.search],
  query: async ({ signal }) => {
    if (!data.value || !props.search) return [] as OpenLibraryApiBook[];
    const res = await getBooksFromOpenLibrary({
      query: props.search,
      signal,
    });

    return res;
  },
});

const emits = defineEmits<{
  (e: 'select', book: OpenLibraryApiBook): void;
}>();
</script>
