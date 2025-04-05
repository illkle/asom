<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnSizingState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table';
import { valueUpdater } from '~/lib/utils';

import { Input } from '@/components/ui/input';
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { useElementSize } from '@vueuse/core';
import { debounce } from 'lodash-es';
import { ChevronDown } from 'lucide-vue-next';
import { ref } from 'vue';
import type { TableRowType } from '~/components/BookView/helpers';
import type { IOpenedPath } from '~/composables/stores/useTabsStore';
import type { AttrValue, SchemaItem } from '~/types';
import BookItemDisplay2 from './BookItemDisplay.vue';

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

const searchQuery = ref('');
watch(
  () => props.opened.settings.searchQuery,
  debounce(() => {
    searchQuery.value = props.opened.settings.searchQuery;
  }, 200),
);

const { data: fileListData, loading: fileListLoading } = useFilesList({
  opened: props.opened,
  //onLoaded: () => setScrollPositionFromSaved(),
  searchQuery: searchQuery,
});

const books = computed(
  () =>
    (fileListData.value?.records.map((v) => ({ ...v.attrs, path: v.path })) ||
      []) as TableRowType[],
);

type IVisibleNames = Record<string, boolean>;
const visibleNames = ref<IVisibleNames>({});

watch(fileListData, (flData) => {
  if (!flData) return;
  visibleNames.value = flData.schema.items.reduce((acc, val) => {
    if (Object.keys(acc).length < 5) {
      acc[val.name] = true;
    }
    return acc;
  }, {} as IVisibleNames);
});

const visibleSchemaItems = computed(
  () => fileListData.value?.schema.items.filter((v) => v.value.type !== 'Image') ?? [],
);

const baseSizeByType = (type: SchemaItem['value']['type']) => {
  switch (type) {
    case 'Text':
      return 200;
    case 'Date':
      return 75;
    case 'TextCollection':
      return 150;
    case 'DateCollection':
      return 150;
    case 'DatesPairCollection':
      return 150;
    default:
      return 50;
  }
};

const cols = computed<ColumnDef<TableRowType>[]>(() =>
  visibleSchemaItems.value.map((v) => ({
    enableResizing: true,
    accessorKey: v.name,
    header: v.name,
    size: baseSizeByType(v.value.type), //starting column size
    sortingFn: 'alphanumeric',
    cell: ({ row }) => {
      return h(BookItemDisplay2, {
        value: row.getValue(v.name) as AttrValue,
      });
    },
  })),
);

watch(books, (v) => {
  console.log(typeof v[2]['ISBN13'].value);
});

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const columnSizing = ref<ColumnSizingState>({ title: 100 });
const rowSelection = ref({});
const expanded = ref<ExpandedState>({});

const table = useVueTable({
  data: books,
  get columns() {
    return cols.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
  onColumnSizingChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnSizing),
  columnResizeMode: 'onChange',

  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },

    get columnSizing() {
      return columnSizing.value;
    },

    get rowSelection() {
      return rowSelection.value;
    },
    get expanded() {
      return expanded.value;
    },
  },
});

const calculatedColumSizes = computed(() => {
  const sizeMultiplier = containerSize.width.value / table.getTotalSize();

  const h = table.getFlatHeaders();
  return Object.fromEntries(h.map((v) => [v.id, Math.round(v.getSize() * sizeMultiplier)]));
});

/**
 * Virtual
 */

const rows = computed(() => table.getRowModel().rows);

//The virtualizer needs to know the scrollable container element
const tableContainerRef = ref<HTMLDivElement | null>(null);
const containerSize = useElementSize(tableContainerRef);

const rowVirtualizerOptions = computed(() => {
  return {
    count: rows.value.length,
    estimateSize: () => 20, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.value,
    overscan: 5,
  };
});

const rowVirtualizer = useVirtualizer(rowVirtualizerOptions);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

function measureElement(el?: Element) {
  if (!el) {
    return;
  }

  rowVirtualizer.value.measureElement(el);

  return undefined;
}
</script>

<template>
  <div class="w-full px-2 relative">
    <div class="flex items-center p-4 sticky top-0 bg-background z-10">
      <Input v-model="searchQuery" />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="ml-auto">
            Columns <ChevronDown class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
            :key="column.id"
            class="capitalize"
            :model-value="column.getIsVisible()"
            @update:model-value="
              (value) => {
                column.toggleVisibility(!!value);
              }
            "
          >
            {{ column.id }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div
      class="mx-auto"
      ref="tableContainerRef"
      :style="{
        overflow: 'auto', //our scrollable table container
        position: 'relative', //needed for sticky header
        height: '500px', //should be a fixed height
      }"
    >
      <div :style="{ height: `${totalSize}px` }">
        <!-- Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights -->
        <Table :style="{ display: 'grid' }">
          <TableHead
            :style="{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }"
          >
            <tr
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              :style="{ display: 'flex', width: '100%' }"
            >
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colspan="header.colSpan"
                class="flex items-center justify-start relative"
                :style="{
                  width: `${calculatedColumSizes[header.column.id]}px`,
                }"
              >
                <div
                  v-if="!header.isPlaceholder"
                  :class="{
                    'cursor-pointer select-none': header.column.getCanSort(),
                  }"
                  @click="(e) => header.column.getToggleSortingHandler()?.(e)"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <span v-if="header.column.getIsSorted() === 'asc'"> 🔼</span>
                  <span v-if="header.column.getIsSorted() === 'desc'"> 🔽</span>
                </div>
                <span
                  @mousedown="
                    (e) => {
                      console.log('mousedown');
                      header.getResizeHandler()(e);
                    }
                  "
                  class="bg-red-500 absolute right-0 top-0 w-2 h-full"
                ></span>
              </th>
            </tr>
          </TableHead>
          <TableBody
            :style="{
              display: 'grid',
              height: `${totalSize}px`, //tells scrollbar how big the table is
              position: 'relative', //needed for absolute positioning of rows
            }"
          >
            <tr
              v-for="vRow in virtualRows"
              :data-index="vRow.index /* needed for dynamic row height measurement*/"
              :ref="measureElement /*measure dynamic row height*/"
              :key="rows[vRow.index].id"
              class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
              :style="{
                display: 'flex',
                position: 'absolute',
                transform: `translateY(${vRow.start}px)`, //this should always be a `style` as it changes on scroll
                width: '100%',
              }"
            >
              <TableCell
                v-for="cell in rows[vRow.index].getVisibleCells()"
                :key="cell.id"
                :style="{
                  display: 'flex',
                  width: `${calculatedColumSizes[cell.column.id]}px`,
                }"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </tr>
          </TableBody>
        </Table>
      </div>
    </div>

    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }} of
        {{ table.getFilteredRowModel().rows.length }} row(s) selected.
      </div>
    </div>
  </div>
</template>
