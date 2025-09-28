<template>
  <div
    class="flex items-center py-2 gap-2 px-2 w-full pr-4 bg-background h-12 z-2"
    :class="$attrs.class"
  >
    <Input v-model="searchQuery" />

    <ListViewTopControls
      :columns="table.getAllColumns()"
      @update-order="viewSettingsUpdater('columnOrder', $event)"
    />
  </div>
  <div
    ref="scrollElementRef"
    class="w-full overflow-auto bg-background overscroll-none h-full scrollbarMod gutter-stable"
  >
    <div
      v-if="selectionMode"
      class="absolute bottom-6 bg-foreground text-primary-foreground shadow-xl rounded-md overflow-hidden min-w-sm left-1/2 -translate-x-1/2 z-10 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <Button
          class="rounded-none border-r hover:bg-muted/10"
          @click="
            () => {
              table.resetRowSelection();
              selectionMode = false;
            }
          "
        >
          <XIcon class="text-primary-foreground" />
        </Button>
        <span class="text-sm block"
          >Selected: {{ table.getFilteredSelectedRowModel().rows.length }}</span
        >
      </div>

      <Button class="rounded-none border-l hover:bg-muted/10" @click="deleteSelected">
        <TrashIcon class="text-primary-foreground" />
      </Button>
    </div>
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
              :key="rows[vRow.index]?.id"
              class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b flex absolute w-full"
              :class="{
                'bg-muted hover:bg-muted/80': rows[vRow.index]?.getIsSelected(),
              }"
              :style="{
                transform: `translateY(${vRow.start}px)`,
              }"
            >
              <td
                data-slot="table-cell"
                v-for="cell in rows[vRow.index]?.getVisibleCells()"
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
            :selection-mode="selectionMode"
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
                selectionMode = true;
                lastSelectedIndex = dropdownRowLock;
                rows[dropdownRowLock]?.toggleSelected();
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
import { ArrowDown, ArrowUp, TrashIcon, XIcon } from 'lucide-vue-next';
import type { AttrValue, RecordFromDb, SchemaResult } from 'types/index';
import { type ShallowRef } from 'vue';
import { c_delete_to_trash } from '~/api/tauriActions';
import ContextMenuTrigger from '~/components/ui/context-menu/ContextMenuTrigger.vue';
import ListViewContextMenu from '~/components/Views/List/ListViewContextMenu.vue';
import ListViewTopControls from '~/components/Views/List/ListViewTopControls.vue';

import { rankItem } from '@tanstack/match-sorter-utils';
import { cloneDeep, debounce } from 'lodash-es';
import type { IViewSettings } from '~/composables/data/useViewSettings';
import {
  useScrollRestorationOnMount,
  useScrollWatcher,
  useTabsStoreV2,
  type IOpened,
} from '~/composables/stores/useTabsStoreV2';
import { baseSizeByType, getSortFunction } from './helpers';
import ListItemDisplay from './ListItemDisplay.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
  viewSettings: {
    type: Object as PropType<IViewSettings | undefined>,
    required: true,
  },
  schema: {
    type: Object as PropType<ShallowRef<SchemaResult | null | undefined>>,
    required: true,
  },
});

const emits = defineEmits<{
  (e: 'update:viewSettings:p', value: Partial<IViewSettings>): void;
}>();

/**
 * Schema is included in files query below, however since files query depends on searchQuery
 * it's better to keep stable schema separately to avoid visual flickering on search change.
 */

const searchQuery = ref(props.opened.details.searchQuery);

watch(
  searchQuery,
  debounce(() => {
    props.opened.details.searchQuery = searchQuery.value ?? '';
  }, 100),
);

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
    accessorKey: `attrs.${v.name}.value`,
    header: getDisplayName(v.name),
    size: baseSizeByType(v.value.type),
    meta: {
      type: v.value.type,
    },
    enableColumnFilter: v.value.type === 'Text' || v.value.type === 'Number',
    sortingFn: getSortFunction(v.value.type),
    cell: ({ row }) => {
      return h(ListItemDisplay, {
        value: row.original.attrs[v.name] as AttrValue,
        type: v.value,
      });
    },
  })),
);

const viewSettingsUpdater = <T extends keyof IViewSettings>(
  key: T,
  newValue: Updater<IViewSettings[T]>,
) => {
  const src = props.viewSettings?.[key];
  if (!src) return;

  emits('update:viewSettings:p', {
    [key]: typeof newValue === 'function' ? newValue(cloneDeep(src)) : newValue,
  });
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

  globalFilterFn: (row, columnId, value, addMeta) => {
    const rowValue = row.getValue(columnId);
    const itemRank = rankItem(rowValue, value);
    addMeta({ itemRank });

    return itemRank.passed;
  },

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
      return props.viewSettings?.columnSizing;
    },

    get sorting() {
      return props.viewSettings?.sorting;
    },

    get columnVisibility() {
      return props.viewSettings?.columnVisibility;
    },

    get columnOrder() {
      return props.viewSettings?.columnOrder;
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

const selectionMode = ref<boolean>(false);

onKeyStroke('Escape', () => {
  if (selectionMode.value) {
    selectionMode.value = false;
    rowSelection.value = {};
  }
});

const selectedRows = computed(() => table.getFilteredSelectedRowModel().rows);
watch(selectedRows, (v) => {
  if (v.length === 0) {
    selectionMode.value = false;
  }
});

/** --- */

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
  if (!selectionMode.value && !wantSelection) {
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

  if (!selectionMode.value) {
    selectionMode.value = true;
  }

  /* Selection mode */
  if (e.shiftKey && lastSelectedIndex.value) {
    const ls = clamp(lastSelectedIndex.value, 0, rows.value.length - 1);

    if (ls > index) {
      for (let i = ls - 1; i >= index; i--) {
        const p = rows.value[i];
        if (!p) continue;
        p.toggleSelected();
      }
    } else {
      for (let i = ls + 1; i <= index; i++) {
        const p = rows.value[i];
        if (!p) continue;
        p.toggleSelected();
      }
    }
  } else {
    row.toggleSelected();
  }
  lastSelectedIndex.value = index;
};

const deleteSelected = async () => {
  const paths = selectedRows.value.map((v) => v.original.path);

  await Promise.allSettled(
    paths.map((v) => {
      if (!v) return new Promise((resolve) => resolve(undefined));
      c_delete_to_trash(v);
    }),
  );
  table.resetRowSelection();
};
</script>
