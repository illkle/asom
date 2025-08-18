<script setup lang="ts">
import type { Input } from '#components';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { onKeyStroke, useEventListener } from '@vueuse/core';
import { cloneDeep, debounce } from 'lodash-es';
import {
  ChevronDownIcon,
  CornerUpRightIcon,
  ListOrdered,
  MoveDown,
  MoveUp,
  SquareDashedMousePointer,
  TrashIcon,
  XIcon,
} from 'lucide-vue-next';
import type { SchemaItem, SchemaResult } from 'types/index';
import { ref, type ShallowRef } from 'vue';
import { c_delete_to_trash } from '~/api/tauriActions';
import {
  useNavigationBlock,
  useScrollRestorationOnMount,
  useScrollWatcher,
  useTabsStoreV2,
  type IOpenedPath,
} from '~/composables/stores/useTabsStoreV2';
import type { IViewSettings } from '~/composables/useViewSettings';
import BookItemDisplay from './BookItemDisplay.vue';
import SimpleDNDList from './SimpleDNDList.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedPath>,
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

const emit = defineEmits<{
  <T extends keyof IViewSettings>(
    e: 'update:viewSettings',
    key: T,
    newValue: IViewSettings[T],
  ): void;
}>();

const searchQuery = ref('');
watch(
  () => props.opened.details.searchQuery,
  debounce(() => {
    searchQuery.value = props.opened.details.searchQuery;
  }, 200),
);

/**
 * Schema is included in files query below, however since files query depends on searchQuery
 * it's better to keep stable schema separately to avoid visual flickering on search change.
 */

const { files: q, filesMemo } = useFlesListV2({
  opened: props.opened,
  searchQuery: searchQuery,
  sort: computed(
    () =>
      props.viewSettings.value?.sorting ?? {
        key: 'title',
        descending: false,
      },
  ),
});

const columnsAll = computed(() => {
  const sortIndexes =
    props.viewSettings.value?.columnOrder.reduce(
      (acc, v, i) => {
        acc[v] = i;
        return acc;
      },
      {} as Record<string, number>,
    ) ?? {};

  const cols = [];

  for (const si of props.schema.value?.schema.items ?? []) {
    if (si.value.type === 'Image') {
      continue;
    }

    cols.push({
      id: si.name,
      label: si.value.settings.displayName ?? si.name,
      type: si.value.type,
      si: si.value,
    });
  }

  cols.sort((a, b) => {
    const ai = sortIndexes[a.id] ?? 9999;
    const bi = sortIndexes[b.id] ?? 9999;
    return ai - bi;
  });

  return cols;
});

const columnsVisible = computed(() => {
  return columnsAll.value.filter((v) => props.viewSettings.value?.columnVisibility[v.id] !== false);
});

const getSizeForColumn = (id: string, type: SchemaItem['value']['type']) => {
  return props.viewSettings.value?.columnSizing?.[id] ?? baseSizeByType(type);
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
      return 100;
  }
};

const rowSelection = ref<Record<string, boolean>>({});

const isSelecting = ref<{ lastSelectedIndex: number | null } | null>(null);

const scrollElementRef = useTemplateRef<HTMLDivElement>('scrollElementRef');
useScrollWatcher(scrollElementRef);
useScrollRestorationOnMount(
  scrollElementRef,
  computed(() => !!scrollElementRef.value),
);

const itemsForSorting = computed(() =>
  columnsAll.value.map((v) => ({
    id: v.id,
    label: v.label,
    isVisible: props.viewSettings.value?.columnVisibility[v.id] !== false,
  })),
);

/**
 * Virtual
 */

const rows = computed(() => filesMemo.value?.records ?? []);

//The virtualizer needs to know the scrollable container element

const tableContainerRef = ref<HTMLDivElement | null>(null);

const rowVirtualizerOptions = computed(() => {
  return {
    count: rows.value.length,
    estimateSize: () => 37, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => scrollElementRef?.value as HTMLDivElement,
    overscan: 5,
  };
});

const rowVirtualizer = useVirtualizer(rowVirtualizerOptions);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

const ts = useTabsStoreV2();

const sortingDialogOpened = ref(false);
useNavigationBlock(sortingDialogOpened);

const hoveringRowIndex = ref<number | null>(null);

const dropdownRowLock = ref<number | null>(null);

const dropdownOpened = ref(false);

const lastSelectedIndex = ref<number | null>(null);

const isMacOS = useIsMac();

onKeyStroke('Escape', () => {
  if (isSelecting.value) {
    isSelecting.value = null;
    rowSelection.value = {};
  }
});

const handlePointerDownOnRow = (index: number, e: PointerEvent) => {
  e.preventDefault();

  if (dropdownOpened.value) return;

  const path = rows.value[index]?.path;
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
        const p = rows.value[i]?.path;
        if (!p) continue;
        rowSelection.value[p] = !rowSelection.value[p];
      }
    } else {
      for (let i = ls + 1; i <= index; i++) {
        const p = rows.value[i]?.path;
        if (!p) continue;
        rowSelection.value[p] = !rowSelection.value[p];
      }
    }
  } else {
    rowSelection.value[path] = !rowSelection.value[path];
  }
  lastSelectedIndex.value = index;
};

const deleteSelected = async () => {
  const paths = Object.keys(rowSelection.value);

  await Promise.allSettled(paths.map((v) => c_delete_to_trash(v)));
  rowSelection.value = {};
};

const startColumnsSizing = (e: MouseEvent, index: number) => {
  const initialState = cloneDeep(props.viewSettings.value?.columnSizing ?? {});

  const initialX = e.clientX;

  const col = columnsVisible.value[index];
  if (!col) return;

  const myId = col.id;

  const myInitialSize = getSizeForColumn(myId, col.type);

  const moveHandler = (e: MouseEvent) => {
    const delta = e.clientX - initialX;

    const ns = { ...initialState };

    ns[myId] = myInitialSize + delta;

    emit('update:viewSettings', 'columnSizing', ns);
  };

  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', moveHandler);
  });
};

const searchInputRef = useTemplateRef<InstanceType<typeof Input>>('searchInputRef');

useEventListener('keydown', (e) => {
  const commandKey = (isMacOS && e.metaKey) || (!isMacOS && e.ctrlKey);

  if (commandKey && e.key === 'f') {
    searchInputRef.value?.$el.focus();
  }
});
</script>

<template>
  <div
    class="flex items-center py-2 gap-2 px-2 w-full pr-4 bg-background h-12 z-2"
    :class="$attrs.class"
  >
    <Input ref="searchInputRef" v-model="searchQuery" />

    <Toggle
      :model-value="isSelecting !== null"
      variant="outline"
      @update:model-value="
        (v) => {
          if (!v) {
            isSelecting = null;
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
          :initial-items="itemsForSorting"
          @order-change="
            (update) => {
              // @ts-ignore vue is being dumb for some reason
              const mapped = update.map((v) => v.id);
              emit('update:viewSettings', 'columnOrder', mapped);

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
          v-for="column in itemsForSorting"
          :key="column.id"
          class="capitalize"
          :model-value="column.isVisible"
          @update:model-value="
            (value) => {
              emit('update:viewSettings', 'columnVisibility', {
                ...props.viewSettings.value?.columnVisibility,
                [column.id]: value,
              });
            }
          "
        >
          {{ column.label }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  <div
    ref="scrollElementRef"
    class="w-full overflow-auto bg-background overscroll-none h-full scrollbarMod gutter-stable"
  >
    <table
      class="w-full px-2 caption-bottom text-sm relative"
      :style="{ height: `${totalSize}px` }"
    >
      <TableHead class="grid sticky top-0 z-10 bg-background h-fit p-0">
        <tr
          ref="tableContainerRef"
          class="mt-1 group transition-opacity duration-200"
          :style="{ display: 'flex', width: '100%' }"
          :class="{
            'opacity-50': !q.data.value,
          }"
        >
          <TableHeader
            v-for="(column, index) in columnsVisible"
            :key="column.id"
            :colspan="1"
            class="flex items-center gap-1 justify-start relative px-2 hover:bg-muted/10 py-2 cursor-pointer select-none"
            :style="{
              width: `${getSizeForColumn(column.id, column.type)}px`,
            }"
            @mousedown="
              (e: MouseEvent) => {
                if (e.button !== 0) return;
                if (props.viewSettings.value?.sorting?.key === column.id) {
                  emit('update:viewSettings', 'sorting', {
                    key: column.id,
                    descending: !props.viewSettings.value?.sorting?.descending,
                  });
                } else {
                  emit('update:viewSettings', 'sorting', {
                    key: column.id,
                    descending: false,
                  });
                }
              }
            "
          >
            <template v-if="props.viewSettings.value?.sorting?.key === column.id">
              <MoveDown
                :size="12"
                v-if="props.viewSettings.value?.sorting.descending"
                class="shrink-0"
              />
              <MoveUp :size="12" v-else class="shrink-0" />
            </template>
            <div class="overflow-hidden text-ellipsis flex gap-2 items-center">
              {{ column.label }}
            </div>

            <div
              class="h-full w-1 rounded-full bg-accent ml-auto cursor-col-resize shrink-0"
              v-if="index !== columnsVisible.length - 1"
              @mousedown.stop.prevent="(e) => startColumnsSizing(e, index)"
            ></div>
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
              height: `${totalSize}px`,
              position: 'relative',
            }"
            @mouseleave="hoveringRowIndex = null"
          >
            <tr
              v-for="vRow in virtualRows"
              :data-index="vRow.index"
              :key="vRow.index"
              class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
              :class="{
                'bg-muted hover:bg-muted/80': rowSelection[rows[vRow.index]?.path ?? ''],
                'cursor-pointer': !isSelecting,
                'cursor-copy': isSelecting,
              }"
              :style="{
                display: 'flex',
                position: 'absolute',
                height: `${vRow.size}px`,
                transform: `translateY(${vRow.start}px)`,
                width: '100%',
              }"
              @pointerdown="(e) => handlePointerDownOnRow(vRow.index, e)"
              @mouseover="hoveringRowIndex = vRow.index"
            >
              <td
                data-slot="table-cell"
                v-for="cell in columnsVisible"
                :key="cell.id"
                class="h-9 px-2 whitespace-nowrap"
                :style="{
                  display: 'flex',
                  flexShrink: 0,
                  width: `${getSizeForColumn(cell.id, cell.type)}px`,
                }"
              >
                <BookItemDisplay :value="rows[vRow.index]?.attrs[cell.id]" :type="cell.si" />
              </td>
            </tr>
          </tbody>
        </ContextMenuTrigger>
        <ContextMenuContent v-if="dropdownRowLock !== null">
          <ContextMenuItem
            @click="
              () => {
                if (typeof dropdownRowLock !== 'number') return;

                ts.openNewThingFast(
                  { _type: 'file', _path: rows[dropdownRowLock]?.path ?? '' },
                  'lastUnfocused',
                );
              }
            "
          >
            <CornerUpRightIcon :size="16" /> Open In New Tab
          </ContextMenuItem>

          <template v-if="!isSelecting">
            <ContextMenuItem
              @click="
                () => {
                  if (typeof dropdownRowLock !== 'number') return;
                  isSelecting = { lastSelectedIndex: dropdownRowLock };
                  rowSelection[rows[dropdownRowLock]?.path ?? ''] = true;
                }
              "
            >
              <SquareDashedMousePointer :size="16" /> Select
            </ContextMenuItem>
            <ContextMenuItem
              @click="
                () => {
                  if (typeof dropdownRowLock !== 'number') return;
                  c_delete_to_trash(rows[dropdownRowLock]?.path ?? '');
                }
              "
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
                  rowSelection = {};
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
</template>
