<template>
  <div class="relative">
    <ApiSearch
      v-model="search"
      :query="q"
      placeholder="Search for a book from Open Library"
      @select="
        (v) => {
          emit('select', v);
        }
      "
    >
      <template #item="{ item }: { item: OpenLibraryApiBook }">
        <img
          v-if="item.cover_low_quality"
          :src="item.cover_low_quality"
          class="w-18 h-27 object-cover block rounded-sm overflow-hidden shrink-0"
        />
        <div v-else class="w-18 h-27 block rounded-sm overflow-hidden bg-muted opacity-10"></div>

        <div class="flex flex-col text-left">
          <span class="text-lg">
            {{ item.title }}
          </span>
          <span class="text-regular text-muted-foreground">{{ item.year }}</span>
          <div class="text-sm text-muted-foreground">{{ item.author_name?.join(', ') }}</div>
        </div>
      </template>
    </ApiSearch>
  </div>
</template>

<script lang="ts" setup>
import { refDebounced } from '@vueuse/core';
import type { ApiSettingsOpenLibrary, OpenLibraryApiBook } from '.';
import ApiSearch from '../common/ApiSearch.vue';
import { getBooksFromOpenLibrary, getEditionsFromOpenLibrary } from './openlibrary';

const data = defineModel<ApiSettingsOpenLibrary>();

const search = ref('');
const debouncedSearch = refDebounced(search, 300);

const id = useId();

const q = useQuery({
  key: () => ['openlibrary', 'search', debouncedSearch.value],
  query: async ({ signal }) => {
    if (!data.value || !debouncedSearch.value) return [] as OpenLibraryApiBook[];
    const res = await getBooksFromOpenLibrary({
      yourEmail: data.value.yourEmail,
      query: debouncedSearch.value,
      signal,
    });

    console.log('res', res);

    return res;
  },
});

const books = computed(() => q.data.value ?? []);

const highlightedIndex = ref(0);

watch(highlightedIndex, (newIndex) => {
  const next = document.getElementById(`${id}-${newIndex}`);
  if (next) {
    next.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

watch(books, (newBooks) => {
  if (newBooks.length > highlightedIndex.value) {
    highlightedIndex.value = 0;
  }
});

const selectedKey = ref<string | null>(null);

const qE = useQuery({
  key: () => ['openlibrary', 'editions', selectedKey.value],
  query: async ({ signal }) => {
    if (!data.value) return [];
    const res = await getEditionsFromOpenLibrary({
      yourEmail: data.value.yourEmail,
      key: selectedKey.value ?? '',
      signal,
    });

    return res;
  },
});

const editions = computed(() => qE.data.value ?? []);

const emit = defineEmits<{
  (e: 'select', book: OpenLibraryApiBook): void;
}>();
</script>
