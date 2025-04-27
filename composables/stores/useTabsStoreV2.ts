import { useDebounceFn, useEventListener } from '@vueuse/core';
import { cloneDeep } from 'lodash-es';
import { defineStore } from 'pinia';

import ShortUniqueId from 'short-unique-id';
import type { ShallowRef } from 'vue';
import { z } from 'zod';

import { ConfigStoredInRootFolder } from '~/utils/configStoredInRootFolder';

const uid = new ShortUniqueId({ length: 10 });

export const generateUniqId = () => uid.randomUUID();

export const spliceKeepingPointer = <T>(array: T[], pointer: number, indexToRemove: number) => {
  const spliceResult = array.splice(indexToRemove, 1);

  if (pointer >= indexToRemove && pointer > 0) {
    pointer--;
  }

  return { spliceResult, pointer };
};

export const removeIndexesKeepingPointer = (
  array: unknown[],
  pointer: number,
  indexesToRemove: number[],
) => {
  for (let i = indexesToRemove.length - 1; i >= 0; i--) {
    const { pointer: newPointer } = spliceKeepingPointer(array, pointer, indexesToRemove[i]);
    pointer = newPointer;
  }

  if (array.length === 0) {
    return -1;
  }

  return pointer;
};

/**
 * Each tab is zTabEntry. Each tab has id and content
 * Content can(and should) be updated on navigations.
 *
 * Tabs store history of all content changes and can naviage back and forward.
 * History is also stored for active tabs chages.
 * Navigating back means going back through tab history, then to previous tab, then through it's history etc.
 *
 * If you close the tab it gets removed from history, though we also store deletion histrory and can restore closed tabs.
 */

/**
 * Never mutate items prefixed with _ they must be modifiend via actions.
 * Other values can be mutated and v-model-ed.
 */

const zPathCore = z.object({
  _type: z.literal('folder'),
  _path: z.string(),
});

export const zOpenedPath = zPathCore.extend({
  scrollPosition: z.number(),
  details: z.object({
    searchQuery: z.string(),
  }),
});

const zFileCore = z.object({
  _type: z.literal('file'),
  _path: z.string(),
});

export const zOpenedFile = zFileCore.extend({
  scrollPosition: z.number(),
});

const zInnerPageCore = z.object({
  _type: z.literal('innerPage'),
  _path: z.enum(['goodreadsImporter']),
});

const zCore = z.discriminatedUnion('_type', [zFileCore, zInnerPageCore, zPathCore]);

export const zOpenedInnerPage = zInnerPageCore.extend({
  scrollPosition: z.number(),
});

export const zOpened = z.discriminatedUnion('_type', [zOpenedFile, zOpenedInnerPage, zOpenedPath]);

export const zTabEntry = z.object({
  id: z.string(),
  /** History is state. Tab without history is just an array of 1 item */
  history: z.array(zOpened).min(1),

  historyPointer: z.number(),
});

export const ZOpenedTabs = z.object({
  openedTabs: z.array(zTabEntry),
  focusHistory: z.array(z.string()),
  focusHistoryPointer: z.number(),
});

export type IOpenedPath = z.infer<typeof zOpenedPath>;
export type IOpenedFile = z.infer<typeof zOpenedFile>;
export type IOpenedInnerPage = z.infer<typeof zOpenedInnerPage>;
export type IOpened = z.infer<typeof zOpened>;
export type ITabEntry = z.infer<typeof zTabEntry>;
export type IOpenedTabs = z.infer<typeof ZOpenedTabs>;

type ICoreBase = z.infer<typeof zCore>;

/**
 * File Store
 */

const openedTabsFile = new ConfigStoredInRootFolder('opened_tabs.json', ZOpenedTabs);

/**
 * Pinia Store
 */

export type OpenNewOneParams = {
  place: 'after' | 'last' | number;
  focus?: boolean;
};

export const useTabsStoreV2 = defineStore('tabs', {
  state: (): IOpenedTabs & { navigationBlocks: Set<string> } => {
    return {
      openedTabs: [],
      focusHistory: [],
      /** -1 means no active tab */
      focusHistoryPointer: -1,
      navigationBlocks: new Set<string>(),
    };
  },

  getters: {
    openedTabActiveId: (state) => {
      return state.focusHistory[state.focusHistoryPointer];
    },

    openedTabActiveIndex(state) {
      const activeID = state.focusHistory[state.focusHistoryPointer];
      if (!activeID) return;
      const index = state.openedTabs.findIndex((v) => v.id === activeID);
      if (index === -1) {
        console.error('Active id is present but no tab with such id exists');
      }
      return index;
    },

    openedTab(): ITabEntry | undefined {
      if (typeof this.openedTabActiveId !== 'string') return;
      return this.openedTabs.find((v) => v.id === this.openedTabActiveId);
    },

    openedItem(): IOpened | undefined {
      if (!this.openedTab) return;
      return this.openedTab.history[this.openedTab.historyPointer];
    },

    canGoBack() {
      if (this.navigationBlocks.size > 0) return false;

      if (!this.openedTab) return false;

      if (this.openedTab?.historyPointer > 0) return true;
      if (this.focusHistoryPointer > 0) return true;

      return false;
    },

    canGoForward() {
      if (this.navigationBlocks.size > 0) return false;

      if (!this.openedTab) return false;

      if (this.openedTab?.historyPointer < this.openedTab?.history.length - 1) return true;
      if (this.focusHistoryPointer < this.focusHistory.length - 1) return true;

      return false;
    },
  },
  actions: {
    /** Preservation on disk */
    async _saveOpened() {
      const tabs: IOpenedTabs = cloneDeep({
        openedTabs: this.openedTabs,
        focusHistory: this.focusHistory,
        focusHistoryPointer: this.focusHistoryPointer,
      });

      await openedTabsFile.set(tabs);
    },
    async _fetchOpened() {
      try {
        const res = await openedTabsFile.get();
        this.openedTabs = res.openedTabs;
        this.focusHistory = res.focusHistory;
        this.focusHistoryPointer = res.focusHistoryPointer;
      } catch (e) {
        console.error('Encountered an error when trying to load tabs state from disk');
      }
    },

    /** Preservation on disk */
    _clearForwardHistoryItem(target: ITabEntry) {
      if (target.historyPointer !== target.history.length - 1) {
        /** If we are not at the end of history, we need to remove all history items after the current one */
        target.history.splice(target.historyPointer + 1, Infinity);
      }
    },
    _clearFocusHistory() {
      if (this.focusHistoryPointer !== this.focusHistory.length - 1) {
        this.focusHistory.splice(this.focusHistoryPointer + 1, Infinity);
      }
    },

    _evictOldestIfNeeded() {
      // This is simples possible eviction logic, will do for now
      if (this.openedTab && this.openedTab?.history.length > 100) {
        this.openedTab.history.splice(0, 25);
        this.openedTab.historyPointer -= 25;

        this.focusHistory = [this.openedTab.id];
        this.focusHistoryPointer = 0;
      }

      if (this.focusHistory.length > 50) {
        this.focusHistory.splice(0, 25);
        this.focusHistoryPointer -= 25;
      }
    },

    /** Core api */

    moveBack() {
      if (!this.canGoBack || !this.openedTab) return;

      if (this.openedTab.historyPointer > 0) {
        this.openedTab.historyPointer--;
      } else if (this.focusHistoryPointer > 0) {
        this.focusHistoryPointer--;
      }
    },

    moveForward() {
      if (!this.canGoForward || !this.openedTab) return;

      if (this.openedTab.historyPointer < this.openedTab.history.length - 1) {
        this.openedTab.historyPointer++;
      } else if (this.focusHistoryPointer < this.focusHistory.length - 1) {
        this.focusHistoryPointer++;
      }
    },

    updateTabContent(data: IOpened, params?: { targetId?: string; scrollPosition?: number }) {
      const target = params?.targetId
        ? this.openedTabs.find((t) => t.id === params.targetId)
        : this.openedTab;

      if (!target) return;

      this._clearForwardHistoryItem(target);
      if (this.openedTab?.id === target.id) {
        this._clearFocusHistory();
      }
      this._evictOldestIfNeeded();

      target.history.push(data);
      target.historyPointer = target.history.length - 1;
    },

    focusTab(id: string) {
      if (this.openedTab) {
        this._clearForwardHistoryItem(this.openedTab);
      }
      this._clearFocusHistory();
      this._evictOldestIfNeeded();

      this.focusHistory.push(id);
      this.focusHistoryPointer++;
    },

    openNewTab(
      data: IOpened,
      params: OpenNewOneParams = {
        place: 'last',
        focus: true,
      },
    ) {
      const newTab: ITabEntry = {
        id: generateUniqId(),
        history: [data],
        historyPointer: 0,
      };

      const place = params.place;

      if (typeof place === 'number') {
        this.openedTabs.splice(place, 0, newTab);
      } else if (place === 'last') {
        this.openedTabs.push(newTab);
      } else if (place === 'after' && typeof this.openedTabActiveIndex === 'number') {
        this.openedTabs.splice(this.openedTabActiveIndex + 1, 0, newTab);
      }

      if (params.focus) {
        this.focusTab(newTab.id);
      }
      return newTab.id;
    },

    closeTab(id: string) {
      const index = this.openedTabs.findIndex((t) => t.id === id);

      if (index === -1) return;

      this.openedTabs.splice(index, 1);

      const deleteFromFocusHistoryIndexes: number[] = [];

      for (const [index, item] of this.focusHistory.entries()) {
        if (item === id) {
          deleteFromFocusHistoryIndexes.push(index);
        }
      }
      this.focusHistoryPointer = removeIndexesKeepingPointer(
        this.focusHistory,
        this.focusHistoryPointer,
        deleteFromFocusHistoryIndexes,
      );
    },

    setOpenedIndexRelative(relative: number) {
      if (!this.openedTabs.length || typeof this.openedTabActiveIndex !== 'number') return;

      const max = this.openedTabs.length;
      const indexToSet = (this.openedTabActiveIndex + relative + max) % max;

      this.focusTab(this.openedTabs[indexToSet].id);
    },

    /**
     * Helpers
     */

    openNewThingFast(
      { _type, _path }: ICoreBase,
      mode: 'here' | 'last' | 'lastUnfocused' = 'here',
    ) {
      let data: IOpened;

      if (_type === 'folder') {
        data = {
          _type: 'folder',
          _path: _path,
          scrollPosition: 0,
          details: {
            searchQuery: '',
          },
        };
      } else if (_type === 'file') {
        data = {
          _type: 'file',
          _path: _path,
          scrollPosition: 0,
        };
      } else if (_type === 'innerPage') {
        data = {
          _type: 'innerPage',
          _path: _path,
          scrollPosition: 0,
        };
      } else {
        throw new Error('Unknown type');
      }

      if (mode === 'here') {
        if (this.openedTab) {
          this.updateTabContent(data);
        } else {
          this.openNewTab(data, { place: 'last', focus: true });
        }
      } else if (mode === 'last') {
        this.openNewTab(data, { place: 'last', focus: true });
      } else if (mode === 'lastUnfocused') {
        this.openNewTab(data, { place: 'last', focus: false });
      } else {
        throw new Error('Unknown mode');
      }
    },

    /**
     * Internal stuff for event handlers
     */

    _handlePathRename(oldPath: string, newPath: string) {
      for (const tab of this.openedTabs) {
        for (const item of tab.history) {
          if (item._type === 'file' || item._type === 'folder') {
            if (item._path.startsWith(oldPath)) {
              item._path = item._path.replace(oldPath, newPath);
            }
          }
        }
      }
    },

    _handlePathDeletion(path: string, isFolder: boolean) {
      const tabsToDeleteId: string[] = [];

      for (const tab of this.openedTabs) {
        const itemsToDelete: number[] = [];

        for (const [index, item] of tab.history.entries()) {
          if (isFolder) {
            if ((item._type === 'folder' || item._type === 'file') && item._path.startsWith(path)) {
              itemsToDelete.push(index);
            }
          } else {
            if (item._type === 'file' && item._path === path) {
              itemsToDelete.push(index);
            }
          }
        }

        if (itemsToDelete.length === tab.history.length) {
          tabsToDeleteId.push(tab.id);
        } else if (itemsToDelete.length > 0) {
          tab.historyPointer = removeIndexesKeepingPointer(
            tab.history,
            tab.historyPointer,
            itemsToDelete,
          );
        }
      }

      for (const id of tabsToDeleteId) {
        this.closeTab(id);
      }
    },
  },
});

/**
 * Hooks
 */

const useTabsPreservation = () => {
  const store = useTabsStoreV2();
  const rootPath = useRootPath();

  watch(
    rootPath.data,
    (v) => {
      if (!v) return;
      store._fetchOpened();
    },
    { immediate: true },
  );

  const saveTabsDebounced = useDebounceFn(store._saveOpened, 5000);

  let unsubscribe: () => void;

  onMounted(() => {
    unsubscribe = store.$subscribe(saveTabsDebounced);
  });

  onUnmounted(() => {
    unsubscribe();
  });
};

const useCloseInvalidTabsOnDeletions = () => {
  const store = useTabsStoreV2();
  useListenToEvent('FileRemove', ({ c: path }) => {
    store._handlePathDeletion(path, false);
  });

  useListenToEvent('FolderRemove', ({ c: event }) => {
    store._handlePathDeletion(event.path, true);
  });
};

export const useGlobalTabHooks = () => {
  useTabsPreservation();
  useCloseInvalidTabsOnDeletions();
};

/**
 * Helper to block navigation when modal is opened or some thing like that.
 * (you can hit back button with dialog opened, but mouse button still need to be disabled manually)
 */
export const useNavigationBlock = (isBlocked: Ref<boolean>) => {
  const store = useTabsStoreV2();

  const id = generateUniqId();

  watch(
    isBlocked,
    (v) => {
      if (v) {
        store.navigationBlocks.add(id);
      } else {
        store.navigationBlocks.delete(id);
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    store.navigationBlocks.delete(id);
  });

  return isBlocked;
};

export const useScrollRestorationOnMount = (condition: Ref<boolean>) => {
  const store = useTabsStoreV2();

  const scrollElementRef = inject<Ref<HTMLDivElement>>('scrollElementRef');

  const mounted = ref(false);

  onMounted(() => {
    mounted.value = true;
  });

  watch([condition, mounted], ([v, v2]) => {
    if (!v2 || !scrollElementRef || !v) return;

    if (!scrollElementRef.value) return;

    nextTick(() => {
      scrollElementRef.value.scrollTo(0, store.openedItem?.scrollPosition ?? 0);
    });
  });
};

export const useScrollWatcher = (item: ShallowRef<HTMLDivElement | null>) => {
  const tabsStore = useTabsStoreV2();

  const ignored = ref(false);

  watch(
    computed(() => tabsStore.openedItem),
    (v) => {
      if (!v) return;
      ignored.value = true;
    },
  );

  useEventListener(item, 'scroll', (e) => {
    if (!tabsStore.openedItem) return;

    if (ignored.value) {
      ignored.value = false;
      return;
    }
    tabsStore.openedItem.scrollPosition = (e.target as HTMLDivElement).scrollTop;
  });
};
