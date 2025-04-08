import { defineStore } from 'pinia';

import { clamp as _clamp, cloneDeep } from 'lodash-es';
import { z } from 'zod';

/**
 * TYPES
 */

export const zOpenedPath = z.object({
  id: z.string(),
  type: z.literal('folder'),
  // Path
  thing: z.string(),
  recursive: z.boolean().optional(),
  scrollPosition: z.number(),
  searchQuery: z.string(),
});

export type IOpenedPath = z.infer<typeof zOpenedPath>;

export const zOpenedFile = z.object({
  id: z.string(),
  type: z.literal('file'),
  // Path
  thing: z.string(),
  scrollPosition: z.number(),
});

export type IOpenedFile = z.infer<typeof zOpenedFile>;

export const zOpenedInnerPage = z.object({
  id: z.string(),
  type: z.literal('innerPage'),
  thing: z.enum(['goodreadsImporter']),
  scrollPosition: z.number(),
});

export type IOpenedInnerPage = z.infer<typeof zOpenedInnerPage>;

export const zOpened = z.discriminatedUnion('type', [zOpenedFile, zOpenedInnerPage, zOpenedPath]);

export type IOpened = z.infer<typeof zOpened>;

export const ZOpenedTabs = z.object({
  tabs: z.array(zOpened),
  activeId: z.string().default(''),
});

export type IOpenedTabs = z.infer<typeof ZOpenedTabs>;

/**
 * File Store
 */

const openedTabsFile = new ConfigStoredInRootFolder('openedTabs.json', ZOpenedTabs);

/**
 * Pinia Store
 */

export type TabsStoreState = {
  openedTabs: IOpenedTabs['tabs'];
  openedTabsActiveId: IOpenedTabs['activeId'];
};

export type OpenNewOneParams =
  | {
      place: 'current' | 'next' | 'last';
      focus?: boolean;
    }
  | {
      place: 'replace' | 'insert';
      index: number;
      focus?: boolean;
    };

export const useTabsStore = defineStore('tabs', {
  state: (): TabsStoreState => {
    return {
      openedTabs: [],
      openedTabsActiveId: '',
    };
  },
  actions: {
    generateRandomId() {
      return generateUniqId();
    },

    openNewOne(item: IOpened, params: OpenNewOneParams) {
      // Place: 'last' is covered here
      let indexToSet = this.openedTabs.length;

      if (params.place === 'insert' || params.place === 'replace') {
        indexToSet = params.index;
      } else if (typeof this.openedTabsActiveIndex === 'number') {
        if (params.place === 'current') {
          indexToSet = this.openedTabsActiveIndex;
        }

        if (params.place === 'next') {
          indexToSet = this.openedTabsActiveIndex + 1;
        }
      }

      if (params.place === 'insert') {
        this.openedTabs.splice(indexToSet, 0, item);
      } else {
        this.openedTabs[indexToSet] = item;
      }

      if (params.focus) {
        this.openedTabsActiveId = item.id;
      }

      this.saveOpened();
    },

    closeOpened(index?: number) {
      if (typeof index !== 'number') {
        index = this.openedTabsActiveIndex;
      }
      if (typeof index !== 'number') return;

      this.openedTabs.splice(index, 1);
      this.setOpenedIndex(index);
      this.saveOpened();
    },

    async saveOpened() {
      const clone: IOpenedTabs = cloneDeep({
        tabs: this.openedTabs,
        activeId: this.openedTabsActiveId,
      });

      openedTabsFile.set(clone);
    },
    async fetchOpened() {
      const res = await openedTabsFile.get();
      this.openedTabs = res.tabs;
      this.openedTabsActiveId = res.activeId;
    },

    setOpenedId(id: string) {
      this.openedTabsActiveId = id;
    },

    setOpenedIndex(index: number) {
      if (!this.openedTabs.length) return;

      index = _clamp(index, 0, this.openedTabs.length - 1);

      this.openedTabsActiveId = this.openedTabs[index].id;
    },
    setOpenedIndexRelative(offset: number) {
      if (!this.openedTabs.length || typeof this.openedTabsActiveIndex !== 'number') return;

      const max = this.openedTabs.length;

      this.setOpenedIndex((this.openedTabsActiveIndex + offset + max) % max);
    },

    saveScrollPosition(index: number, value: number) {
      this.openedTabs[index].scrollPosition = value;
    },

    updateOpened(data: IOpenedTabs['tabs']) {
      this.openedTabs = data;
    },

    handleFolderRename(oldPath: string, newPath: string) {
      console.log('handleFolderRename', oldPath, newPath);
      this.openedTabs.forEach((tab) => {
        if (tab.type === 'folder') {
          if (tab.thing === oldPath) {
            tab.thing = newPath;
            tab.id = generateUniqId();
          } else if (tab.thing.startsWith(oldPath)) {
            tab.thing = tab.thing.replace(oldPath, newPath);
            tab.id = generateUniqId();
          }
        }

        if (tab.type === 'file' && tab.thing.includes(oldPath)) {
          tab.thing = tab.thing.replace(oldPath, newPath);
          tab.id = generateUniqId();
        }
      });
    },
  },
  getters: {
    openedTabsActiveIndex: (state) => {
      if (typeof state.openedTabsActiveId !== 'string') return;
      const res = state.openedTabs.findIndex((t) => t.id === state.openedTabsActiveId);
      return res === -1 ? undefined : res;
    },

    openedItem(): IOpened | undefined {
      if (typeof this.openedTabsActiveIndex === 'number') {
        return this.openedTabs[this.openedTabsActiveIndex];
      }
    },
  },
});

/**
 * Helpers
 */

const useFetchTabsOnRootPathChange = () => {
  const store = useTabsStore();
  const rootPath = useRootPath();

  watch(
    rootPath.data,
    (v) => {
      if (!v) return;
      store.fetchOpened();
    },
    { immediate: true },
  );
};

const useCloseInvalidTabsOnDeletions = () => {
  const store = useTabsStore();
  useListenToEvent('FileRemove', ({ c: path }) => {
    if (store.openedItem?.thing === path) {
      store.closeOpened();
    }

    nextTick(() => {
      const filtered = store.openedTabs.filter((v) => v.thing !== path);

      if (filtered.length !== store.openedTabs.length) {
        store.updateOpened(filtered);
      }
    });
  });
};

export const useGlobalTabHooks = () => {
  useFetchTabsOnRootPathChange();
  useCloseInvalidTabsOnDeletions();
};
