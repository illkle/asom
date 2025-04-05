<script setup lang="ts">
import type {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table';
import { valueUpdater } from '~/lib/utils';

import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { useElementSize } from '@vueuse/core';
import { debounce } from 'lodash-es';
import {
  ArrowDown,
  ArrowUp,
  ChevronDownIcon,
  ListOrdered,
  MoveHorizontal,
  SquareDashedMousePointer,
} from 'lucide-vue-next';
import { ref } from 'vue';
import { getSortFunction, type TableRowType } from '~/components/BookView/helpers';
import {
  useTabsStore,
  type IOpenedPath,
  type OpenNewOneParams,
} from '~/composables/stores/useTabsStore';
import { useViewSettingsStore } from '~/composables/stores/useViewSettingsStore';
import type { AttrValue, SchemaItem } from '~/types';
import BookItemDisplay from './BookItemDisplay.vue';
import TestDND from './TestDND.vue';

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

const { data: fileListData, pending: fileListPending } = useFilesList({
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
    sortingFn: getSortFunction(v.value.type),
    cell: ({ row }) => {
      return h(BookItemDisplay, {
        value: row.getValue(v.name) as AttrValue,
      });
    },
  })),
);

const vs = useViewSettingsStore();

const viewSettings = ref<{
  sorting?: SortingState;
  columnVisibility?: VisibilityState;
  columnSizing?: ColumnSizingState;
  columnOrder?: ColumnOrderState;
}>({
  sorting: [],
  columnVisibility: {},
  columnSizing: {},
  columnOrder: [],
});

const rowSelection = ref({});

const isSelecting = ref(false);

watch(
  props.opened,
  async () => {
    const s = await vs.loadSettings(props.opened.thing);
    viewSettings.value = s;
  },
  { immediate: true },
);

const debouncedSaveSettings = debounce(async () => {
  await vs.updateSettings(props.opened.thing, viewSettings.value);
}, 100);

watch(
  [viewSettings],
  async () => {
    debouncedSaveSettings();
  },
  { deep: true },
);

const table = useVueTable({
  data: books,
  get columns() {
    return cols.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, viewSettings, 'sorting'),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, viewSettings, 'columnVisibility'),
  onColumnSizingChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, viewSettings, 'columnSizing'),
  onColumnOrderChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, viewSettings, 'columnOrder'),

  onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
  columnResizeMode: 'onChange',

  state: {
    get sorting() {
      return viewSettings.value.sorting;
    },

    get columnVisibility() {
      return viewSettings.value.columnVisibility;
    },

    get columnSizing() {
      return viewSettings.value.columnSizing;
    },

    get columnOrder() {
      return viewSettings.value.columnOrder;
    },

    get rowSelection() {
      return rowSelection.value;
    },
  },
});

const injectScrollElementRef = inject<Ref<HTMLDivElement>>('scrollElementRef');
const containerSize = useElementSize(injectScrollElementRef);

const calculatedColumSizes = computed(() => {
  // Subtract padding from container size
  const sizeMultiplier = (containerSize.width.value - 16) / table.getTotalSize();

  const h = table.getFlatHeaders();
  return Object.fromEntries(h.map((v) => [v.id, Math.round(v.getSize() * sizeMultiplier)]));
});

/**
 * Virtual
 */

const rows = computed(() => table.getRowModel().rows);

//The virtualizer needs to know the scrollable container element

const tableContainerRef = ref<HTMLDivElement | null>(null);

const rowVirtualizerOptions = computed(() => {
  return {
    count: rows.value.length,
    estimateSize: () => 20, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => injectScrollElementRef?.value as HTMLDivElement,
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

const listForSorting = computed({
  get() {
    const column = visibleSchemaItems.value.map((v) => v.name);
    const order = viewSettings.value.columnOrder?.filter((v) => v in column) ?? [];

    return [...order, ...column.filter((v) => !order.includes(v))];
  },
  set(newVal) {
    viewSettings.value.columnOrder = [...newVal];
  },
});

const ts = useTabsStore();

const openFullEditor = (params: OpenNewOneParams, path: string | null) => {
  if (!path) return;
  ts.openNewOne(
    {
      id: ts.generateRandomId(),
      type: 'file',
      thing: path,
      scrollPosition: 0,
    },
    params,
  );
};
</script>

<template>
  <div class="w-full px-2 relative">
    <div class="mx-auto">
      <div :style="{ height: `${totalSize}px` }" class="transition-opacity duration-100">
        <!-- Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights -->
        <table class="w-full caption-bottom text-sm grid">
          <TableHead class="grid sticky top-0 z-10 bg-background h-fit p-0" :style="{}">
            <div class="flex items-center py-2 gap-2">
              <Input v-model="searchQuery" />

              <Toggle
                v-model="isSelecting"
                variant="outline"
                @update:model-value="
                  (v) => {
                    if (!v) {
                      table.setRowSelection({});
                    }
                  }
                "
              >
                <SquareDashedMousePointer :size="16" />
              </Toggle>

              <Dialog>
                <DialogTrigger as-child>
                  <Button variant="outline" size="icon">
                    <ListOrdered :size="16" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <TestDND />
                  <div v-if="false" ref="parent" class="relative">
                    <div
                      class="block"
                      v-for="(item, index) in listForSorting"
                      :key="item"
                      :index="index"
                      variant="outline"
                    >
                      {{ item }}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="ml-auto">
                    Columns <ChevronDownIcon class="ml-2 h-4 w-4" />
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
            <tr
              ref="tableContainerRef"
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              class="mt-1 group"
              :style="{ display: 'flex', width: '100%' }"
            >
              <TableHeader
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colspan="header.colSpan"
                class="flex items-center gap-2 justify-start relative px-2 hover:bg-muted/10 py-2"
                :class="{
                  'cursor-pointer select-none': header.column.getCanSort(),
                }"
                :style="{
                  width: `${calculatedColumSizes[header.column.id]}px`,
                }"
                @mousedown="() => header.column.toggleSorting()"
              >
                <ArrowDown :size="16" v-if="header.column.getIsSorted() === 'desc'" />
                <ArrowUp :size="16" v-else-if="header.column.getIsSorted() === 'asc'" />

                <div
                  v-if="!header.isPlaceholder"
                  class="overflow-hidden text-ellipsis flex gap-2 items-center"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </div>

                <span
                  @click.stop
                  @mousedown.stop="
                    (e) => {
                      header.getResizeHandler()(e);
                    }
                  "
                  class="flex items-center opacity-20 group-hover:opacity-100 transition-all justify-center w-5 shrink-0 h-5 cursor-col-resize ml-3 border border-transparent hover:border-border rounded-sm"
                >
                  <MoveHorizontal :size="12" />
                </span>
              </TableHeader>
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
              :class="{ 'bg-muted hover:bg-muted/80': rows[vRow.index].getIsSelected() }"
              :style="{
                display: 'flex',
                position: 'absolute',
                transform: `translateY(${vRow.start}px)`, //this should always be a `style` as it changes on scroll
                width: '100%',
              }"
              @click="isSelecting && rows[vRow.index].toggleSelected()"
              @click.exact="
                !isSelecting &&
                openFullEditor({ place: 'current', focus: true }, rows[vRow.index].original.path)
              "
              @click.alt="
                !isSelecting && openFullEditor({ place: 'last' }, rows[vRow.index].original.path)
              "
              @click.middle.exact="
                !isSelecting && openFullEditor({ place: 'last' }, rows[vRow.index].original.path)
              "
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
        </table>
      </div>
    </div>
  </div>
</template>
