<template>
  <div
    ref="widgetDiv"
    class="relative h-10 overflow-hidden z-30"
    @drop="onDrop($event)"
    @dragenter.prevent="dragEnter"
    @dragleave.prevent="dragLeave"
    @dragover.prevent
  >
    <!-- Invisible controls for move\drag logic -->
    <div v-if="isDragging || canDropHere">
      <div
        v-for="item in store.openedTabs"
        :key="item.id"
        class="absolute top-0 left-0 h-10 px-2 py-1 select-none"
        :style="{
          width: TAB_WIDTH_PX + 'px',
          transform: `translateX(${getXPosition(item.id)}px)`,
          zIndex: isDragging && item.id === draggingTab ? -1 : 4,
        }"
        @mouseover="mouseOverHandler(item.id)"
        @dragover="dragOverHandler(item.id)"
      ></div>
      <div
        class="absolute top-0 left-0 h-10 px-2 py-1 select-none"
        :style="{
          width: `calc(100% - ${TAB_WIDTH_PX * store.openedTabs.length}px)`,
          transform: `translateX(${TAB_WIDTH_PX * store.openedTabs.length}px)`,
          zIndex: 1,
        }"
      ></div>
    </div>
    <!-- Visible tabs -->
    <div
      v-for="(item, index) in store.openedTabs"
      :key="item.id"
      :class="[
        'absolute top-0 left-0 select-none',
        item.id !== store.openedTabActiveId && 'cursor-pointer',
        item.id === store.openedTabActiveId && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
      ]"
      :style="{
        transitionProperty: isInitialMount ? 'none' : 'transform',
        transitionDuration:
          draggingTab === item.id && isDragging ? '0s' : `${TAB_MOVE_DURATION_MS / 1000}s`,
        width: TAB_WIDTH_PX + 'px',
        transform: `translateX(${getXPosition(item.id)}px)`,
        zIndex: getZIndex(item.id),
      }"
      @mousedown="mouseDownHandler(item.id)"
    >
      <TabVisual
        :width-awailable="TAB_WIDTH_PX"
        :is-active="store.openedTabActiveId === item.id"
        :item="item"
        :is-new-and-animating="animatingNewTabs.has(item.id)"
        @close="store.closeTab(item.id)"
      />
    </div>
    <div
      data-tauri-drag-region
      class="dragApp absolute top-0 left-0 h-10 bg-muted select-none"
      :style="{
        width: `calc(100% - ${TAB_WIDTH_PX * store.openedTabs.length}px)`,
        transform: `translateX(${TAB_WIDTH_PX * store.openedTabs.length}px)`,
        zIndex: 1,
      }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { clamp } from 'lodash-es';
import { computed, onMounted, ref, watch } from 'vue';
import TabVisual from './TabsSelectorTab.vue';

import { useElementSize, useMouse } from '@vueuse/core';
import {
  setupTabsHotkeys,
  useTabsStoreV2,
  type ITabEntry,
} from '~/composables/stores/useTabsStoreV2';

const store = useTabsStoreV2();

//
// Style helpers
//
const getZIndex = (id: string) => {
  if (draggingTab.value === id) return 3;
  if (store.openedTabActiveId === id) return 2;
  return 1;
};

const widgetDiv = ref();
const { width } = useElementSize(widgetDiv);

const TAB_WIDTH_PX = computed(() =>
  Math.floor(Math.min(width.value ? width.value / store.openedTabs.length : Infinity, 150)),
);
const TAB_MOVE_DURATION_MS = 300;

//
// Dragging tabs around
//
const isDragging = ref(false);
const draggingTab = ref<string | null>(null);
const newIndex = ref<null | number>(null);

const baseXMouse = ref(0);
const baseXTab = ref(0);
const { x } = useMouse({ touch: false });

const xOffset = computed(() => (isDragging.value ? x.value - baseXMouse.value : 0));

const isInitialMount = ref(true);

onMounted(() => {
  // To prevent tabs animation on initial load
  // Next tick(even multiple) not working here for some reason
  setTimeout(() => {
    isInitialMount.value = false;
  });
});

const virtualizedOrder = computed(() => {
  const order = [...store.openedTabs];

  if (typeof newIndex.value === 'number') {
    // This is the case where we move existing tabs
    if (typeof draggingTab.value === 'string') {
      const draggingIndex = order.findIndex((v) => v.id === draggingTab.value);
      order.splice(newIndex.value, 0, order.splice(draggingIndex, 1)[0]!);
    } else {
      // This is when we drag from somewhere to create new tab
      order.splice(newIndex.value, 0, {} as ITabEntry);
    }
  }

  return order;
});

const mouseDownHandler = (id: string) => {
  store.focusTab(id);
  clearTimeout(commitTimeout.value);

  baseXTab.value = getXPosition(id);
  baseXMouse.value = x.value;

  draggingTab.value = id;
  isDragging.value = true;

  window.addEventListener('mouseup', mouseUpHandler);
};

const commitVirtualized = () => {
  store.openedTabs = virtualizedOrder.value;
  newIndex.value = null;
  draggingTab.value = null;
};

const commitTimeout = ref();

const mouseUpHandler = () => {
  window.removeEventListener('mouseup', mouseUpHandler);

  if (isDragging.value && typeof newIndex.value === 'number') {
    commitTimeout.value = setTimeout(commitVirtualized, TAB_MOVE_DURATION_MS);

    isDragging.value = false;
  } else {
    newIndex.value = null;
    draggingTab.value = null;
    isDragging.value = false;
  }
};

const mouseOverHandler = (id: string) => {
  if (typeof draggingTab.value === 'string') {
    newIndex.value = virtualizedOrder.value.findIndex((v) => v.id === id);
  }
};

const getXPosition = (id: string) => {
  const v = virtualizedOrder.value.findIndex((v) => v.id === id) * TAB_WIDTH_PX.value;

  if (id === draggingTab.value && isDragging.value) {
    return clamp(baseXTab.value + xOffset.value, 0, width.value - TAB_WIDTH_PX.value);
  }
  return clamp(v, 0, width.value - TAB_WIDTH_PX.value);
};

//
// Drag & Drop from file\tag trees
//
const canDropHere = ref(false);

const dragEnter = (e: DragEvent) => {
  canDropHere.value = true;
};

const dragLeave = (e: DragEvent) => {
  const cur = e.currentTarget as HTMLDivElement;
  const rel = e.relatedTarget as HTMLDivElement;

  if (cur.contains(rel)) {
    return;
  }

  canDropHere.value = false;
  newIndex.value = null;
};

const dragOverHandler = (id: string) => {
  newIndex.value = virtualizedOrder.value.findIndex((v) => v.id === id);
};

const onDrop = (e: DragEvent) => {
  canDropHere.value = false;

  const type = e.dataTransfer?.getData('type');
  const draggedPath = e.dataTransfer?.getData('itemPath');

  if (type !== 'file' && type !== 'folder') return;
  if (!draggedPath) return;

  /*
  store.openNewTab(
    {
      _type: type,
      _path: draggedPath,
      scrollPosition: 0,
      details: {
        searchQuery: '',
      },
    },
    typeof newIndex.value === 'number'
      ? {
          place: newIndex.value,
          focus: true,
        }
      : { place: 'last', focus: true },
  );
  */

  newIndex.value = null;
  draggingTab.value = null;
};

// New tab animation
// Unfortunatelly we cannot use vue's Transition\TransitionGroup, it sucks and is incompatible with our logic
// This tracks new additions to tabs and sets animation class for them
const shouldAnimateNew = ref(false);
const animatingNewTabs = ref(new Set());
const existingIds = ref(new Set());

watch(
  () => store.openedTabs,
  (newVal) => {
    if (!shouldAnimateNew.value) {
      shouldAnimateNew.value = true;
      existingIds.value = new Set(newVal.map((v) => v.id));
    }

    for (const v of newVal) {
      if (v.id && !existingIds.value.has(v.id)) {
        animatingNewTabs.value.add(v.id);
        setTimeout(() => {
          animatingNewTabs.value.delete(v.id);
        }, 300);
      }
    }
    existingIds.value = new Set(newVal.map((v) => v.id));
  },
  { deep: true },
);

// Hotkeys
setupTabsHotkeys();
</script>

<style scoped></style>
