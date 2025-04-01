<template>
  <div class="relative px-2 pr-4">
    <div>
      <div class="sticky top-0 bg-neutral-100 dark:bg-neutral-950">
        <div class="flex gap-4 py-2">
          <UIBasicInput v-model="props.opened.settings.searchQuery" />

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline"><EllipsisVertical :size="16" /></Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                v-for="item in data?.schema.items"
                v-model:checked="visibleNames[item.name]"
                @select.prevent
              >
                {{ item.name }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div class="group mb-4 flex h-8 w-full flex-row gap-2 px-4">
          <ResizablePanelGroup @layout="(v) => (resval = v)" direction="horizontal">
            <template v-for="(column, index) in visibleSchemaItems" :key="column.name">
              <ResizableHandle
                v-if="index > 0"
                class="mx-3 box-border w-[0.075rem] rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              />
              <ResizablePanel class="flex items-center font-bold" :min-size="5">
                {{ column.name }}
              </ResizablePanel>
            </template>
          </ResizablePanelGroup>
        </div>
      </div>

      <div v-if="books.length === 0 && !loading">
        <EmptyBooksPlaceholder />
      </div>

      <div
        v-for="file in books"
        :key="file.path || 'a'"
        class="gap-4 border-b border-neutral-200 transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800"
      >
        <BookViewBookContextMenu :path="file.path || 'a'">
          <template v-if="file.path">
            <div class="flex flex-row gap-[1.575rem] p-4">
              <div
                v-for="(column, index) in visibleSchemaItems"
                :key="column.name"
                class="w-full truncate"
                :style="{ width: `${resval[index]}%` }"
              >
                <BookViewBookItemDisplay :schema-item="column" :book="file" />
              </div>
            </div>
          </template>
          <template v-else> Error: book without path </template>
        </BookViewBookContextMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce as _debounce } from 'lodash';

import { EllipsisVertical } from 'lucide-vue-next';
import type { PropType } from 'vue';

import EmptyBooksPlaceholder from '~/components/Placeholders/EmptyBooksPlaceholder.vue';

import type { IOpenedPath } from '~/composables/stores/useTabsStore';

const tes = ref();
onMounted(() => (tes.value = Math.random()));

const resval = ref([] as number[]);

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedPath>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
});

//
// Search
//

const searchQuery = ref('');
watch(
  () => props.opened.settings.searchQuery,
  _debounce(() => {
    searchQuery.value = props.opened.settings.searchQuery;
  }, 200),
);

//
//
//
const { data, loading } = useFilesList({
  opened: props.opened,
  //onLoaded: () => setScrollPositionFromSaved(),
  searchQuery: searchQuery,
});

const books = computed(() => data.value?.records || []);

type IVisibleNames = Record<string, boolean>;
const visibleNames = ref<IVisibleNames>({});

watch(data, (v) => {
  if (!v) return;
  visibleNames.value = v.schema.items.reduce((acc, val) => {
    if (Object.keys(acc).length < 5) {
      acc[val.name] = true;
    }
    return acc;
  }, {} as IVisibleNames);
});

const visibleSchemaItems = computed(() =>
  data.value?.schema.items.filter((v) => visibleNames.value[v.name]),
);

//
// Scroll position
//

/*
const scrollRoot = containerProps.ref;

const setScrollPositionFromSaved = () => {
  if (!scrollRoot.value) return;
  scrollRoot.value.scrollTop = props.opened.scrollPosition;
};

const tabsStore = useTabsStore();

const saveScrollPos = () => {
  if (!scrollRoot.value) return;
  tabsStore.saveScrollPosition(props.index, scrollRoot.value.scrollTop);
};

onMounted(() => {
  if (!scrollRoot.value) return;
  scrollRoot.value.addEventListener('scroll', saveScrollPos);
});

onUnmounted(() => {
  if (!scrollRoot.value) return;
  scrollRoot.value.removeEventListener('scroll', saveScrollPos);
});
*/
</script>

<style scoped>
.cards {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  grid-auto-rows: max-content;
}
</style>
