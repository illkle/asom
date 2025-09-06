<template>
  <div class="relative">
    <Input
      v-model="search"
      autofocus
      placeholder="Search for a book from Open Library"
      class="w-full peer"
      :class="{ 'rounded-b-none': books.length > 0 }"
      @keydown.down.prevent="
        () => {
          highlightedIndex = clamp(highlightedIndex + 1, 0, books.length - 1);
        }
      "
      @keydown.up.prevent="
        () => {
          highlightedIndex = clamp(highlightedIndex - 1, 0, books.length - 1);
        }
      "
    />

    <div
      class="absolute top-full left-0 w-full z-10 bg-background peer-focus:block hidden"
      :class="{ block: books.length > 0 }"
    >
      <div
        v-if="books.length > 0"
        class="flex flex-col max-h-[300px] h-full overflow-y-auto scrollbarMod border border-t-0 rounded-b-md"
      >
        <button
          v-for="(book, index) in books"
          :key="book.key"
          :id="`${id}-${index}`"
          class="flex gap-4 hover:bg-muted py-2 px-2"
          :class="{ 'bg-muted': highlightedIndex === index }"
          @click="selectedKey = book.key"
        >
          <img
            v-if="book.editions.docs[0]?.cover_i"
            :src="`https://covers.openlibrary.org/b/id/${book.editions.docs[0].cover_i}-M.jpg`"
            class="w-18 h-27 object-cover block rounded-sm overflow-hidden shrink-0"
          />
          <img
            v-else-if="book.cover_i"
            :src="`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`"
            class="w-18 h-27 object-cover block rounded-sm overflow-hidden shrink-0"
          />
          <div v-else class="w-18 h-27 block rounded-sm overflow-hidden bg-muted opacity-10"></div>

          <div class="flex flex-col text-left">
            <span class="text-lg">
              {{ book.title }}
            </span>
            <span class="text-regular text-muted-foreground">{{ book.first_publish_year }}</span>
            <div class="text-sm text-muted-foreground">{{ book.author_name?.join(', ') }}</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { refDebounced } from '@vueuse/core';
import type { ApiSettingsOpenLibrary, OpenLibraryApiBook } from '.';
import { getBooksFromOpenLibrary, getEditionsFromOpenLibrary } from './openlibrary';

const data = defineModel<ApiSettingsOpenLibrary>();

const search = ref('');
const debouncedSearch = refDebounced(search, 300);

const id = useId();

const q = useQuery({
  key: () => ['openlibrary', 'search', debouncedSearch.value],
  query: async ({ signal }) => {
    if (!data.value) return [];
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
