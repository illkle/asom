import { defineStore, acceptHMRUpdate } from 'pinia';

import { clamp as _clamp, cloneDeep } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';
import ShortUniqueId from 'short-unique-id';

import {
  type IOpenedTabs,
  type IOpened,
  type IViewSettings,
  setOpenedTabs,
  getOpenedTabs,
} from '~/api/openedTabs';
import { getRootPath } from '~/api/rootPath';
import type { ErrFR, Schema } from '~/types';

const uid = new ShortUniqueId({ length: 10 });

export type StateType = {
  rootPath: string | null;
  openedTabs: IOpenedTabs['tabs'];
  openedTabsActiveId: IOpenedTabs['activeId'];
  errorModal: ErrFR | null;
  schemas: Schema[];
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

export const useMainStore = defineStore('main', {
  state: (): StateType => {
    return {
      rootPath: null,
      schemas: [],
      openedTabs: [],
      openedTabsActiveId: '',
      errorModal: null,
    };
  },
  actions: {
    //
    // Opened Tabs
    //

    generateRandomId() {
      return uid.randomUUID();
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

      setOpenedTabs(clone);
    },
    async fetchOpened() {
      const res = await getOpenedTabs();
      this.openedTabs = res.tabs;
      this.openedTabsActiveId = res.activeId;
    },
    async fetchRootPath() {
      this.rootPath = await getRootPath();
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

    //
    // Updates
    //
    updateOpened(data: IOpenedTabs['tabs']) {
      this.openedTabs = data;
    },

    // Err
    setError(data: ErrFR) {
      this.errorModal = data;
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
    currentViewSettings(): IViewSettings | undefined {
      if (!this.openedItem) return;
      if (this.openedItem.type !== 'folder') return undefined;

      return this.openedItem.settings;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
}

export const rootPathFromStore = () => {
  const store = useMainStore();

  const r = store.rootPath;

  if (typeof r !== 'string') {
    throw new Error('No Root Path');
  }

  return r;
};
