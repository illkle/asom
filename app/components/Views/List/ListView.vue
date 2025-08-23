<script setup lang="ts">
import type { Input } from '#components';
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type Updater,
} from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { onKeyStroke } from '@vueuse/core';
import { ArrowDown, ArrowUp } from 'lucide-vue-next';
import type { AttrValue, RecordFromDb, SchemaResult } from 'types/index';
import { type ShallowRef } from 'vue';
import { c_delete_to_trash } from '~/api/tauriActions';
import ContextMenuTrigger from '~/components/ui/context-menu/ContextMenuTrigger.vue';
import ListViewContextMenu from '~/components/Views/List/ListViewContextMenu.vue';
import ListViewTopControls from '~/components/Views/List/ListViewTopControls.vue';

import {
  useScrollRestorationOnMount,
  useScrollWatcher,
  useTabsStoreV2,
  type IOpened,
} from '~/composables/stores/useTabsStoreV2';
import type { IViewSettings } from '~/composables/useViewSettings';
import { baseSizeByType, getSortFunction } from './helpers';
import ListItemDisplay from './ListItemDisplay.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
  viewSettings: {
    type: Object as PropType<Ref<IViewSettings | undefined>>,
    required: true,
  },
  schema: {
    type: Object as PropType<ShallowRef<SchemaResult | null | undefined>>,
    required: true,
  },
});

/**
 * Schema is included in files query below, however since files query depends on searchQuery
 * it's better to keep stable schema separately to avoid visual flickering on search change.
 */

const searchQuery = ref('было');

const { files: q, filesMemo } = useFlesListV2({
  opened: props.opened,
  searchQuery: toRef(''),
  sort: computed(() => ({
    key: 'title',
    descending: false,
  })),
});

const visibleSchemaItems = computed(
  () => props.schema.value?.schema.items.filter((v) => v.value.type !== 'Image') ?? [],
);

const mapIdToSchemaItem = computed(() => {
  return new Map(visibleSchemaItems.value.map((v) => [v.name, v.value]));
});

const getDisplayName = (id: string) => {
  return mapIdToSchemaItem.value.get(id)?.settings.displayName ?? id;
};

const cols = computed<ColumnDef<RecordFromDb>[]>(() =>
  visibleSchemaItems.value.map((v) => ({
    enableResizing: true,
    id: v.name,
    accessorKey: `attrs.${v.name}`,
    header: getDisplayName(v.name),
    size: baseSizeByType(v.value.type),
    meta: {
      type: v.value.type,
    },
    enableColumnFilter: true,
    sortingFn: getSortFunction(v.value.type),
    cell: ({ cell, column }) => {
      return h(ListItemDisplay, {
        value: cell.getValue() as AttrValue,
        type: v.value,
      });
    },
  })),
);

const viewSettingsUpdater = <T extends keyof IViewSettings>(
  key: T,
  newValue: Updater<IViewSettings[T]>,
) => {
  props.viewSettings.value[key] =
    typeof newValue === 'function' ? newValue(props.viewSettings.value[key]) : newValue;
};

const rowSelection = ref({});
const rowSelectionUpdater = (updaterOrValue: Updater<typeof rowSelection.value>) => {
  if (typeof updaterOrValue === 'function') {
    rowSelection.value = updaterOrValue(rowSelection.value);
  } else {
    rowSelection.value = updaterOrValue;
  }
};

const table = useVueTable({
  get data() {
    return q.data.value?.records ?? [];
  },
  get columns() {
    return cols.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),

  globalFilterFn: () => {
    console.log('globalFilterFn');
    return false;
  },
  /*
  globalFilterFn: (row, columnId, value, addMeta) => {
    console.log('globalFilterFn', row, columnId, value, addMeta);
    const rowValue = row.getValue(columnId) as AttrValue;
    const itemRank = rankItem(attrValueToStringForFuzzyFiltering(rowValue), value);
    addMeta({ itemRank });

    return itemRank.passed;
  },*/

  onSortingChange: (updaterOrValue) => viewSettingsUpdater('sorting', updaterOrValue),
  onColumnVisibilityChange: (updaterOrValue) =>
    viewSettingsUpdater('columnVisibility', updaterOrValue),
  onColumnOrderChange: (updaterOrValue) => viewSettingsUpdater('columnOrder', updaterOrValue),
  onRowSelectionChange: (updaterOrValue) => rowSelectionUpdater(updaterOrValue),
  onColumnSizingChange: (updaterOrValue) => viewSettingsUpdater('columnSizing', updaterOrValue),

  columnResizeMode: 'onChange',

  onGlobalFilterChange: (updaterOrValue) => {
    searchQuery.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(searchQuery.value) : updaterOrValue;
  },

  state: {
    get globalFilter() {
      return searchQuery.value;
    },

    get columnSizing() {
      return props.viewSettings.value?.columnSizing;
    },

    get sorting() {
      return props.viewSettings.value?.sorting;
    },

    get columnVisibility() {
      return props.viewSettings.value?.columnVisibility;
    },

    get columnOrder() {
      return props.viewSettings.value?.columnOrder;
    },
    get rowSelection() {
      return rowSelection.value;
    },
  },
});

const rows = computed(() => table.getRowModel().rows);

const scrollElementRef = ref<HTMLDivElement | null>(null);
useScrollWatcher(scrollElementRef);
useScrollRestorationOnMount(
  scrollElementRef,
  computed(() => !!scrollElementRef.value && !!q.data.value?.records),
);

/**
 * Virtual
 */

const rowVirtualizerOptions = computed(() => {
  return {
    count: rows.value.length,
    estimateSize: () => 37,
    getScrollElement: () => scrollElementRef.value as HTMLDivElement,
    overscan: 10,
  };
});
const rowVirtualizer = useVirtualizer(rowVirtualizerOptions);
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

/** Dropdown */

const dropdownRowLock = ref<number | null>(null);

const dropdownOpened = ref(false);

const lastSelectedIndex = ref<number | null>(null);

/** Selection */

const isSelecting = ref<boolean>(false);

onKeyStroke('Escape', () => {
  if (isSelecting.value) {
    isSelecting.value = null;
    rowSelection.value = {};
  }
});

const ts = useTabsStoreV2();

const isMacOS = useIsMac();

const handlePointerDownOnRow = (index: number, e: PointerEvent) => {
  e.preventDefault();

  if (dropdownOpened.value) return;

  const row = rows.value[index];
  if (!row) return;

  const path = row.original.path;
  if (!path) return;

  const LMB = e.button === 0;
  const RMB = e.button === 2;

  if (RMB) {
    /**
     * Opening with be handled by ContextMenuTrigger. Two handlers might theoretically cause issues, switch to tracking hovered row by mouseenter if any appear.
     */
    dropdownRowLock.value = index;
    return;
  }

  const targetRow = rows.value[index];
  if (!targetRow) return;

  const wantSelection = (isMacOS && e.metaKey) || (!isMacOS && e.ctrlKey);

  /* Opening cases */
  if (!isSelecting.value && !wantSelection) {
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
    isSelecting.value = true;
  }

  /* Selection mode */
  if (e.shiftKey && lastSelectedIndex.value) {
    const ls = clamp(lastSelectedIndex.value, 0, rows.value.length - 1);

    if (ls > index) {
      for (let i = ls - 1; i >= index; i--) {
        const p = rows.value[i];
        if (!p) continue;
        row.toggleSelected();
      }
    } else {
      for (let i = ls + 1; i <= index; i++) {
        const p = rows.value[i];
        if (!p) continue;
        row.toggleSelected();
      }
    }
  } else {
    row.toggleSelected();
  }
  lastSelectedIndex.value = index;
};

const deleteSelected = async () => {
  const paths = Object.keys(rowSelection.value);

  await Promise.allSettled(paths.map((v) => c_delete_to_trash(v)));
  rowSelection.value = {};
};
</script>

<template>
  <div
    class="flex items-center py-2 gap-2 px-2 w-full pr-4 bg-background h-12 z-2"
    :class="$attrs.class"
  >
    <Input v-model="searchQuery" />

    {{ table.getState().globalFilter }}

    {{ table.getRowModel().rows.length }}

    <ListViewTopControls
      :columns="table.getAllColumns()"
      @update-order="viewSettingsUpdater('columnOrder', $event)"
    />
  </div>
  <div
    ref="scrollElementRef"
    class="w-full overflow-auto bg-background overscroll-none h-full scrollbarMod gutter-stable"
  >
    <table class="text-sm grid">
      <!-- Table Header -->
      <thead class="grid sticky top-0 z-1">
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="group pb-2 bg-gradient-to-b from-background to-transparent from-[calc(100%-8px)] flex w-full"
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
              width: `${table.getColumn(header.column.id)?.getSize()}px`,
            }"
            @mousedown="() => header.column.toggleSorting()"
          >
            <ArrowDown :size="16" v-if="header.column.getIsSorted() === 'desc'" />
            <ArrowUp :size="16" v-else-if="header.column.getIsSorted() === 'asc'" />

            <div
              v-if="!header.isPlaceholder"
              class="overflow-hidden text-ellipsis flex gap-2 items-center"
            >
              <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
            </div>

            <span
              @click.stop
              @mousedown.stop="
                (e) => {
                  header.getResizeHandler()(e);
                }
              "
              class="bg-accent w-1 rounded-xl h-3/4 opacity-20 group-hover:opacity-100 transition-all absolute right-0 cursor-col-resize z-10"
            >
            </span>
          </TableHeader>
        </tr>
      </thead>
      <ContextMenu v-model:open="dropdownOpened">
        <ContextMenuTrigger>
          <!-- Table Body -->
          <tbody
            data-slot="table-body"
            class="[&_tr:last-child]:border-0 flex relative"
            :style="{
              height: `${totalSize}px`,
            }"
          >
            <tr
              v-for="vRow in virtualRows"
              :key="rows[vRow.index].id"
              class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors flex absolute w-full"
              :class="{
                'bg-muted hover:bg-muted/80': rows[vRow.index].getIsSelected(),
              }"
              :style="{
                transform: `translateY(${vRow.start}px)`,
              }"
            >
              <td
                data-slot="table-cell"
                v-for="cell in rows[vRow.index].getVisibleCells()"
                :key="cell.id"
                class="h-9 px-2 whitespace-nowrap flex shrink-0"
                :style="{ width: `${cell.column.getSize()}px` }"
                @pointerdown="handlePointerDownOnRow(vRow.index, $event)"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
          </tbody>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <!-- Right Click Menu-->
          <ListViewContextMenu
            :selection-mode="isSelecting"
            @open-in-new-tab="
              () => {
                if (typeof dropdownRowLock !== 'number') return;
                ts.openNewThingFast(
                  { _type: 'file', _path: rows[dropdownRowLock]?.original.path ?? '' },
                  'lastUnfocused',
                );
              }
            "
            @select="
              () => {
                if (typeof dropdownRowLock !== 'number') return;
                isSelecting = true;
                lastSelectedIndex = dropdownRowLock;
                rows[dropdownRowLock].toggleSelected();
              }
            "
            @delete="
              () => {
                if (typeof dropdownRowLock !== 'number') return;
                c_delete_to_trash(rows[dropdownRowLock]?.original.path ?? '');
              }
            "
          />
        </ContextMenuContent>
      </ContextMenu>
    </table>
  </div>
</template>
