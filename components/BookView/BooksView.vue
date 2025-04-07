<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table';
import { remove } from '@tauri-apps/plugin-fs';
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
  CornerUpRightIcon,
  ListOrdered,
  MoveHorizontal,
  SquareDashedMousePointer,
  TrashIcon,
} from 'lucide-vue-next';
import { ref } from 'vue';
import { getSortFunction, type TableRowType } from '~/components/BookView/helpers';
import {
  useTabsStore,
  type IOpenedPath,
  type OpenNewOneParams,
} from '~/composables/stores/useTabsStore';
import type { AttrValue, SchemaItem } from '~/types';
import BookItemDisplay from './BookItemDisplay.vue';
import SimpleDNDList from './SimpleDNDList.vue';

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

const q = useFlesListV2({
  opened: props.opened,
  //onLoaded: () => setScrollPositionFromSaved(),
  searchQuery: searchQuery,
});

const books = computed(
  () => (q.data.value?.records.map((v) => ({ ...v.attrs, path: v.path })) || []) as TableRowType[],
);

type IVisibleNames = Record<string, boolean>;
const visibleNames = ref<IVisibleNames>({});

watch(q.data, (flData) => {
  if (!flData) return;
  visibleNames.value = flData.schema.items.reduce((acc, val) => {
    if (Object.keys(acc).length < 5) {
      acc[val.name] = true;
    }
    return acc;
  }, {} as IVisibleNames);
});

const visibleSchemaItems = computed(
  () => q.data.value?.schema.items.filter((v) => v.value.type !== 'Image') ?? [],
);

const mapIdToDisplayName = computed(() => {
  return new Map(q.data.value?.schema.items.map((v) => [v.name, v.value.settings.displayName]));
});

const getDisplayName = (id: string) => {
  return mapIdToDisplayName.value.get(id) ?? id;
};

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
    header: getDisplayName(v.name),
    size: baseSizeByType(v.value.type), //starting column size
    sortingFn: getSortFunction(v.value.type),
    cell: ({ row }) => {
      return h(BookItemDisplay, {
        value: row.getValue(v.name) as AttrValue,
      });
    },
  })),
);

const { q: viewSettingsQ, viewSettingsUpdater } = useViewSettings(props.opened.thing);

const viewSettings = computed<IViewSettings>(() => viewSettingsQ.data.value ?? {});

const rowSelection = ref({});

const isSelecting = ref(false);

const table = useVueTable({
  data: books,
  get columns() {
    return cols.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  // View Settings
  onSortingChange: (updaterOrValue) => viewSettingsUpdater(updaterOrValue, 'sorting'),
  onColumnVisibilityChange: (updaterOrValue) =>
    viewSettingsUpdater(updaterOrValue, 'columnVisibility'),
  onColumnSizingChange: (updaterOrValue) => viewSettingsUpdater(updaterOrValue, 'columnSizing'),
  onColumnOrderChange: (updaterOrValue) => viewSettingsUpdater(updaterOrValue, 'columnOrder'),

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
    const visibility = viewSettings.value.columnVisibility ?? {};

    const co = viewSettings.value.columnOrder ?? [];

    const inResult = new Set(co);
    const result = co.map((v) => ({
      id: v,
      label: getDisplayName(v) as string | undefined,
      isVisible: visibility[v] ?? true,
    }));

    for (const item of visibleSchemaItems.value) {
      if (!inResult.has(item.name)) {
        result.push({
          id: item.name,
          label: getDisplayName(item.name),
          isVisible: visibility[item.name] ?? true,
        });
      }
    }

    return result;
  },
  set(newVal) {
    viewSettingsUpdater(
      newVal.map((v) => v.id),
      'columnOrder',
    );
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

const sortingDialogOpened = ref(false);

const hoveringRowIndex = ref<number | null>(null);

const dropdownRowLock = ref<number | null>(null);

const dropdownOpened = ref(false);

const openItemNewTab = (index: number) => {
  openFullEditor({ place: 'last' }, rows.value[index].original.path);
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

              <Dialog v-model:open="sortingDialogOpened">
                <DialogContent>
                  <DialogTitle>Sort Columns</DialogTitle>
                  <DialogDescription> </DialogDescription>
                  <SimpleDNDList
                    :initial-items="listForSorting"
                    @update="
                      (v) => {
                        listForSorting = v;
                        sortingDialogOpened = false;
                      }
                    "
                  />
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="ml-auto">
                    Columns <ChevronDownIcon class="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="sortingDialogOpened = true">
                    <ListOrdered :size="16" /> Reorder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Toggle Visibility</DropdownMenuLabel>

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
                    {{ getDisplayName(column.id) }}
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
                class="flex items-center gap-1 justify-start relative px-2 hover:bg-muted/10 py-2"
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
                  class="flex items-center opacity-20 group-hover:opacity-100 transition-all justify-center shrink-0 p-0.5 cursor-col-resize border border-transparent hover:border-border rounded-sm"
                >
                  <MoveHorizontal :size="12" />
                </span>
              </TableHeader>
            </tr>
          </TableHead>
          <ContextMenu
            v-model:open="dropdownOpened"
            @update:open="
              (v) => {
                if (v) {
                  dropdownRowLock = hoveringRowIndex;
                }
              }
            "
          >
            <ContextMenuTrigger>
              <tbody
                data-slot="table-body"
                class="[&_tr:last-child]:border-0"
                :style="{
                  display: 'grid',
                  height: `${totalSize}px`, //tells scrollbar how big the table is
                  position: 'relative', //needed for absolute positioning of rows
                }"
                @mouseleave="hoveringRowIndex = null"
              >
                <tr
                  v-for="vRow in virtualRows"
                  :data-index="vRow.index /* needed for dynamic row height measurement*/"
                  :ref="measureElement /*measure dynamic row height*/"
                  :key="rows[vRow.index].id"
                  class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                  :class="{
                    'bg-muted hover:bg-muted/80': rows[vRow.index].getIsSelected(),
                    'cursor-pointer': !isSelecting,
                    'cursor-copy': isSelecting,
                  }"
                  :style="{
                    display: 'flex',
                    position: 'absolute',
                    transform: `translateY(${vRow.start}px)`, //this should always be a `style` as it changes on scroll
                    width: '100%',
                  }"
                  @pointerdown="
                    (e) => {
                      if (dropdownOpened || e.button !== 0) return;

                      if (isSelecting) {
                        rows[vRow.index].toggleSelected();
                      } else {
                        openFullEditor(
                          { place: 'current', focus: true },
                          rows[vRow.index].original.path,
                        );
                      }
                    }
                  "
                  @pointerdown.alt="
                    () => {
                      if (dropdownOpened || isSelecting) return;
                      openItemNewTab(vRow.index);
                    }
                  "
                  @pointerdown.middle.exact="
                    () => {
                      if (dropdownOpened || isSelecting) return;
                      openItemNewTab(vRow.index);
                    }
                  "
                  @mouseover="hoveringRowIndex = vRow.index"
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
              </tbody>
            </ContextMenuTrigger>
            <ContextMenuContent v-if="dropdownRowLock !== null">
              <ContextMenuItem @click="dropdownRowLock && openItemNewTab(dropdownRowLock)">
                <CornerUpRightIcon :size="16" /> Open In New Tab
              </ContextMenuItem>
              <ContextMenuItem
                v-if="!isSelecting"
                @click="
                  () => {
                    if (!dropdownRowLock) return;
                    isSelecting = true;
                    table.setRowSelection({ [rows[dropdownRowLock].id]: true });
                  }
                "
              >
                <SquareDashedMousePointer :size="16" /> Select
              </ContextMenuItem>
              <ContextMenuItem
                v-else
                @click="
                  () => {
                    isSelecting = false;
                    table.setRowSelection({});
                  }
                "
              >
                Clear selection
              </ContextMenuItem>
              <ContextMenuItem
                @click="dropdownRowLock && remove(rows[dropdownRowLock].original.path ?? '')"
              >
                <TrashIcon :size="16" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </table>
      </div>
    </div>
  </div>
</template>
