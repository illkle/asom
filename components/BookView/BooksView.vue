<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table';
import { remove } from '@tauri-apps/plugin-fs';
import { platform } from '@tauri-apps/plugin-os';
import { valueUpdater } from '~/lib/utils';

import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { onKeyStroke, useElementSize } from '@vueuse/core';
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
  XIcon,
} from 'lucide-vue-next';
import { ref } from 'vue';
import { getSortFunction, type TableRowType } from '~/components/BookView/helpers';
import { useTabsStoreV2, type IOpenedPath } from '~/composables/stores/useTabsStoreV2';
import type { AttrValue, SchemaItem } from '~/types';
import BookItemDisplay from './BookItemDisplay.vue';
import SimpleDNDList from './SimpleDNDList.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedPath>,
    required: true,
  },
});

const searchQuery = ref('');
watch(
  () => props.opened.details.searchQuery,
  debounce(() => {
    searchQuery.value = props.opened.details.searchQuery;
  }, 200),
);

const { files: q, schema: schemaQ } = useFlesListV2({
  opened: props.opened,
  searchQuery: searchQuery,
});

const schemaPath = computed(() => schemaQ.data.value?.owner_folder ?? '');

const { q: viewSettingsQ, viewSettingsUpdater } = useViewSettings(schemaPath);

const books = computed(
  () => (q.data.value?.records.map((v) => ({ ...v.attrs, path: v.path })) || []) as TableRowType[],
);

const visibleSchemaItems = computed(
  () => schemaQ.data.value?.schema.items.filter((v) => v.value.type !== 'Image') ?? [],
);

const mapIdToDisplayName = computed(() => {
  return new Map(visibleSchemaItems.value.map((v) => [v.name, v.value.settings.displayName]));
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
        type: v.value,
      });
    },
  })),
);

const viewSettings = computed<IViewSettings>(
  () => viewSettingsQ.data.value ?? DEFAULT_VIEW_SETTINGS(),
);

const rowSelection = ref({});

const isSelecting = ref<{ lastSelectedIndex: number | null } | null>(null);

const table = useVueTable({
  get data() {
    return books.value;
  },
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
    estimateSize: () => 36, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => injectScrollElementRef?.value as HTMLDivElement,
    overscan: 10,
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

const ts = useTabsStoreV2();

const sortingDialogOpened = ref(false);

const hoveringRowIndex = ref<number | null>(null);

const dropdownRowLock = ref<number | null>(null);

const dropdownOpened = ref(false);

const sortedColumnsForToggles = computed(() => {
  return table
    .getAllColumns()
    .filter((column) => column.getCanHide())
    .sort((a, b) => {
      const av = viewSettings.value.columnOrder.findIndex((v) => v === a.id) ?? -1;
      const bv = viewSettings.value.columnOrder.findIndex((v) => v === b.id) ?? -1;
      return av - bv;
    });
});

const listForSorting2 = computed({
  get() {
    return sortedColumnsForToggles.value.map((v) => {
      return { id: v.id, label: getDisplayName(v.id), isVisible: v.getIsVisible() };
    });
  },
  set(newVal) {
    viewSettingsUpdater(
      newVal.map((v) => v.id),
      'columnOrder',
    );
  },
});

const lastSelectedIndex = ref<number | null>(null);

const currentPlatform = platform();
const isMacOS = currentPlatform === 'macos';

onKeyStroke('Escape', () => {
  if (isSelecting.value) {
    isSelecting.value = null;
    table.setRowSelection({});
  }
});

const handlePointerDownOnRow = (index: number, e: PointerEvent) => {
  e.preventDefault();

  if (dropdownOpened.value) return;

  const path = rows.value[index].original.path;
  if (!path) return;

  const LMB = e.button === 0;

  const targetRow = rows.value[index];
  if (!targetRow) return;

  const wantSelection = (isMacOS && e.metaKey) || (!isMacOS && e.ctrlKey);

  if (!isSelecting.value && !wantSelection) {
    // Open in new tab
    const openNewTabKeyboard = ((isMacOS && e.metaKey) || (!isMacOS && e.altKey)) && LMB;
    const middleClick = e.button === 1;

    if (openNewTabKeyboard || middleClick) {
      ts.openNewThingFast({ _type: 'file', _path: path }, e.shiftKey ? 'last' : 'lastUnfocused');
    } else if (LMB) {
      ts.openNewThingFast({ _type: 'file', _path: path }, 'here');
    }
    return;
  }

  if (!LMB) return;

  if (!isSelecting.value) {
    isSelecting.value = { lastSelectedIndex: null };
  }

  if (e.shiftKey && lastSelectedIndex.value) {
    const ls = clamp(lastSelectedIndex.value, 0, rows.value.length - 1);

    if (ls > index) {
      for (let i = ls - 1; i >= index; i--) {
        rows.value[i].toggleSelected();
      }
    } else {
      for (let i = ls + 1; i <= index; i++) {
        rows.value[i].toggleSelected();
      }
    }
  } else {
    targetRow.toggleSelected();
  }
  lastSelectedIndex.value = index;
};

const deleteSelected = async () => {
  await Promise.allSettled(
    Object.keys(rowSelection.value).map((v) => {
      remove(rows.value[Number(v)].original.path ?? '');
    }),
  );
  table.setRowSelection({});
};
</script>

<template>
  <div class="w-full px-2 relative">
    <div class="mx-auto">
      <div :style="{ height: `${totalSize}px` }" class="">
        <!-- Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights -->
        <table class="w-full caption-bottom text-sm grid">
          <TableHead class="grid sticky top-0 z-10 bg-background h-fit p-0" :style="{}">
            <div class="flex items-center py-2 gap-2">
              <Input v-model="searchQuery" />

              <Toggle
                :model-value="isSelecting !== null"
                variant="outline"
                @update:model-value="
                  (v) => {
                    if (!v) {
                      isSelecting = null;
                      table.setRowSelection({});
                    } else {
                      isSelecting = { lastSelectedIndex: null };
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
                    :initial-items="listForSorting2"
                    @update="
                      (v) => {
                        listForSorting2 = v;
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
                    v-for="column in sortedColumnsForToggles"
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
                  @pointerdown="(e) => handlePointerDownOnRow(vRow.index, e)"
                  @mouseover="hoveringRowIndex = vRow.index"
                >
                  <td
                    data-slot="table-cell"
                    v-for="cell in rows[vRow.index].getVisibleCells()"
                    :key="cell.id"
                    class="h-9 px-2 whitespace-nowrap"
                    :style="{
                      display: 'flex',
                      width: `${calculatedColumSizes[cell.column.id]}px`,
                    }"
                  >
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                  </td>
                </tr>
              </tbody>
            </ContextMenuTrigger>
            <ContextMenuContent v-if="dropdownRowLock !== null">
              <ContextMenuItem
                @click="
                  dropdownRowLock &&
                  ts.openNewThingFast(
                    { _type: 'file', _path: rows[dropdownRowLock].original.path ?? '' },
                    'lastUnfocused',
                  )
                "
              >
                <CornerUpRightIcon :size="16" /> Open In New Tab
              </ContextMenuItem>

              <template v-if="!isSelecting">
                <ContextMenuItem
                  @click="
                    () => {
                      if (!dropdownRowLock) return;
                      isSelecting = { lastSelectedIndex: dropdownRowLock };
                      rows[dropdownRowLock].toggleSelected();
                    }
                  "
                >
                  <SquareDashedMousePointer :size="16" /> Select
                </ContextMenuItem>
                <ContextMenuItem
                  @click="dropdownRowLock && remove(rows[dropdownRowLock].original.path ?? '')"
                >
                  <TrashIcon :size="16" />
                  Delete
                </ContextMenuItem>
              </template>

              <template v-else>
                <ContextMenuSeparator />
                <ContextMenuLabel>
                  {{ Object.values(rowSelection).filter((v) => v).length }} selected
                </ContextMenuLabel>
                <ContextMenuItem
                  @click="
                    () => {
                      isSelecting = null;
                      table.setRowSelection({});
                    }
                  "
                >
                  <XIcon :size="16" /> Clear selection
                </ContextMenuItem>
                <ContextMenuItem @click="deleteSelected">
                  <TrashIcon :size="16" />
                  Delete
                </ContextMenuItem>
              </template>
            </ContextMenuContent>
          </ContextMenu>
        </table>
      </div>
    </div>
  </div>
</template>
